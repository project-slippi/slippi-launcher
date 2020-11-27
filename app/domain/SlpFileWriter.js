import EventEmitter from 'events';
import net from 'net';
import _ from 'lodash';
import path from 'path';
import {
  Ports,
  Command,
  SlpStreamEvent,
  SlpFileWriter as SlpFileWriteStream,
  SlpFileWriterEvent,
} from '@slippi/slippi-js';
import OBSManager from './OBSManager';

export default class SlpFileWriter extends EventEmitter {
  constructor(settings) {
    super();
    this.folderPath = settings.folderPath;
    this.onFileStateChange = settings.onFileStateChange;
    this.id = settings.id;
    this.consoleNick = settings.consoleNick;
    this.currentFile = this.getClearedCurrentFile();
    this.obs = new OBSManager(settings);
    this.slpStream = new SlpFileWriteStream({
      folderPath: this.folderPath,
      consoleNickname: this.consoleNick,
      newFilename: getNewFilePath,
    });
    this.isRelaying = settings.isRelaying;
    this.clients = [];
    this.manageRelay();
    this.setupListeners();
  }

  getClearedCurrentFile() {
    return {
      buffersToConcat: [],
      fullBuffer: Buffer.from([]),
      path: null,
    };
  }

  getFullBuffer() {
    if (this.currentFile.buffersToConcat.length > 0) 
      this.currentFile.fullBuffer = Buffer.concat([this.currentFile.fullBuffer, ...this.currentFile.buffersToConcat]);
    this.currentFile.buffersToConcat = [];
    return this.currentFile.fullBuffer;
  }

  manageRelay() {
    if (!this.isRelaying) {
      // If relay has been disabled, clear states
      const clients = this.clients || [];
      _.each(clients, client => client.destroy());

      if (this.server) {
        this.server.close();
      }

      this.server = null;
      this.clients = [];

      return;
    }

    if (this.server) {
      // If server is already up, no need to start
      return;
    }

    this.server = net.createServer(socket => {
      socket.setNoDelay().setTimeout(20000);

      // Only get the full buffer when the client connects for performance
      const buf = this.getFullBuffer();
      socket.write(buf);

      this.clients.push(socket);
      socket.on('close', err => {
        if (err) console.warn(err);
        _.remove(this.clients, client => socket === client);
      });
    });
    this.server.listen(Ports.RELAY_START + this.id, '0.0.0.0');
  }

  getCurrentFilePath() {
    return _.get(this.currentFile, 'path');
  }

  updateSettings(settings) {
    this.folderPath = settings.targetFolder || this.folderPath;
    this.id = settings.id || this.id;
    this.isRelaying = settings.isRelaying || this.isRelaying;
    this.consoleNick = settings.consoleNick || this.consoleNick;
    this.obs.updateSettings(settings);
    this.slpStream.updateSettings({
      folderPath: this.folderPath,
      consoleNickname: this.consoleNick,
    });
    this.manageRelay();
  }

  connectOBS() {
    this.obs.connect();
  }

  disconnectOBS() {
    if (!this.obs) {
      return;
    }

    this.obs.disconnect();
  }

  handleData(newData) {
    this.slpStream.write(newData);

    this.currentFile.buffersToConcat.push(newData);

    if (this.clients) {
      _.each(this.clients, client => {
        client.write(newData);
      });
    }
  }

  setupListeners() {
    // Forward the new-file event on
    this.slpStream.on(SlpFileWriterEvent.NEW_FILE, (filePath) => {
      // Clear the current file and update current file path
      this.initializeNewGame(filePath);
      this.onFileStateChange();

      console.log(`Creating new file at: ${filePath}`);
      this.emit('new-file', filePath);
    });

    this.slpStream.on(SlpFileWriterEvent.FILE_COMPLETE, () => {
      console.log('Finished writing file.');
      // Update file state
      this.onFileStateChange();
    });

    // Update the metadata based on parsed data
    this.slpStream.on(SlpStreamEvent.COMMAND, data => {
      const { command, payload } = data;
      switch (command) {
      case Command.POST_FRAME_UPDATE:
        // Only show OBS source in the later portion of the game loading stage
        if (payload.frame >= -60) {
          this.obs.handleStatusOutput();
        }
        break;
      case Command.GAME_END:
        if (payload.gameEndMethod !== 7) {
          this.obs.handleStatusOutput(700);
        }
        break;
      default:
        break;
      }
    });
  }

  endGame() {
    this.slpStream.endCurrentFile();
  }

  initializeNewGame(filePath) {
    const clearFileObj = this.getClearedCurrentFile();
    this.currentFile = {
      ...clearFileObj,
      path: filePath,
    };
  }
}

const getNewFilePath = (folderPath, m) => path.join(
  folderPath,
  `Game_${m.format('YYYYMMDD')}T${m.format('HHmmss')}.slp`
);
