/*

MIT License

Copyright (c) 2017 jlaferri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import EventEmitter from 'events';
import net from 'net';
import _ from 'lodash';
import path from 'path';
import moment from 'moment';
import {
  Ports,
  SlpFile,
  Command,
  SlpStream,
  SlpStreamEvent,
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
    this.slpStream = new SlpStream();
    this.isRelaying = settings.isRelaying;
    this.clients = [];
    this.manageRelay();
    this.setupListeners();
  }

  getClearedCurrentFile() {
    return {
      payloadSizes: {},
      previousBuffer: Buffer.from([]),
      fullBuffer: Buffer.from([]),
      path: null,
      writeStream: null,
      lastFrame: -124,
      startTime: null,
    };
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

      const clientData = {
        socket: socket,
        readPos: 0,
      };

      this.clients.push(clientData);
      socket.on('close', err => {
        if (err) console.log(err);
        _.remove(this.clients, client => socket === client.socket);
      });
    });
    this.server.listen(Ports.RELAY_START + this.id, '0.0.0.0');
  }

  getCurrentFilePath() {
    return _.get(this.currentFile, 'path');
  }

  updateSettings(settings) {
    this.folderPath = settings.targetFolder;
    this.id = settings.id;
    this.isRelaying = settings.isRelaying;
    this.consoleNick = settings.consoleNick || this.consoleNick;
    this.obs.updateSettings(settings);
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

    // Write data to relay, we do this after processing in the case there is a new game, we need
    // to have the buffer ready
    this.currentFile.fullBuffer = Buffer.concat([
      this.currentFile.fullBuffer,
      newData,
    ]);

    if (this.clients) {
      const buf = this.currentFile.fullBuffer;
      _.each(this.clients, client => {
        client.socket.write(buf.slice(client.readPos));

        // eslint doesn't like the following line... I feel like it's a valid use case but idk,
        // maybe there's risks with doing this?
        client.readPos = buf.byteLength; // eslint-disable-line
      });
    }
  }

  setupListeners() {
    // Write the raw data to the SlpFile
    this.slpStream.on(SlpStreamEvent.RAW, data => {
      const { command, payload } = data;
      switch (command) {
      case Command.MESSAGE_SIZES:
        this.initializeNewGame();
        this.writeCommand(payload);
        this.onFileStateChange();
        break;
      case Command.GAME_END:
        this.writeCommand(payload);
        this.endGame();
        break;
      case Command.GAME_START:
        this.writeCommand(payload);
        break;
      default:
        this.writeCommand(payload);
        if (this.currentFile.lastFrame >= -60) {
          // Only show OBS source in the later portion of the game loading stage
          this.obs.handleStatusOutput();
        }
        break;
      }
    });

    // Update the metadata based on parsed data
    this.slpStream.on(SlpStreamEvent.COMMAND, data => {
      const { command, payload } = data;
      switch (command) {
      case Command.POST_FRAME_UPDATE:
        // Update frame index
        this.currentFile.lastFrame = payload.frame;
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

  writeCommand(bufToWrite) {
    // Write data
    const writeStream = this.currentFile.writeStream;
    if (!writeStream) {
      return;
    }
    writeStream.write(bufToWrite);
  }

  initializeNewGame() {
    const startTime = moment();
    const filePath = this.getNewFilePath(startTime);
    const writeStream = new SlpFile(filePath);

    const clearFileObj = this.getClearedCurrentFile();
    this.currentFile = {
      ...clearFileObj,
      path: filePath,
      writeStream: writeStream,
      startTime: startTime,
      metadata: {
        ...clearFileObj.metadata,
      },
    };

    // Clear clients back to position zero
    this.clients = _.map(this.clients, client => ({
      ...client,
      readPos: 0,
    }));

    console.log(`Creating new file at: ${filePath}`);
    this.emit('new-file', filePath);
  }

  getNewFilePath(m) {
    return path.join(
      this.folderPath,
      `Game_${m.format('YYYYMMDD')}T${m.format('HHmmss')}.slp`
    );
  }

  endGame() {
    const writeStream = this.currentFile.writeStream;
    if (!writeStream) {
      // Clear current file
      this.currentFile = this.getClearedCurrentFile();

      return;
    }

    writeStream.setMetadata({
      consoleNickname: this.consoleNick,
      startTime: this.currentFile.startTime,
    });

    // End the stream
    writeStream.end(() => {
      console.log('Finished writting file.');
      // Clear current file
      this.currentFile = this.getClearedCurrentFile();
      // Update file state
      this.onFileStateChange();
    });
  }
}
