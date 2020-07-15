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
import OBSWebSocket from 'obs-websocket-js';
import {
  Ports,
  SlpFile,
  Command,
  SlpStream,
  SlpStreamEvent,
} from '@slippi/slippi-js';

export default class SlpFileWriter extends EventEmitter {
  constructor(settings) {
    super();
    this.folderPath = settings.folderPath;
    this.onFileStateChange = settings.onFileStateChange;
    this.obsSourceName = settings.obsSourceName;
    this.obsIP = settings.obsIP;
    this.obsPassword = settings.obsPassword;
    this.id = settings.id;
    this.consoleNick = settings.consoleNick;
    this.currentFile = this.getClearedCurrentFile();
    this.obs = new OBSWebSocket();
    this.slpStream = new SlpStream();
    this.statusOutput = {
      status: false,
      timeout: null,
    };
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
      metadata: {
        startTime: null,
        lastFrame: -124,
        players: {},
      },
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
    this.obsIP = settings.obsIP;
    this.obsSourceName = settings.obsSourceName;
    this.obsPassword = settings.obsPassword;
    this.id = settings.id;
    this.isRelaying = settings.isRelaying;
    this.consoleNick = settings.consoleNick || this.consoleNick;
    this.manageRelay();
  }

  getSceneSources = async () => {
    // eslint-disable-line
    const res = await this.obs.send('GetSceneList');
    const scenes = res.scenes || [];
    const pairs = _.flatMap(scenes, scene => {
      const sources = scene.sources || [];
      return _.map(sources, source => ({
        scene: scene.name,
        source: source.name,
      }));
    });
    this.obsPairs = _.filter(pairs, pair => pair.source === this.obsSourceName);
  };

  async connectOBS() {
    if (this.obsIP && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      await this.obs.connect({
        address: this.obsIP,
        password: this.obsPassword,
      });
      await this.obs.on(
        'SceneItemAdded',
        async () => this.getSceneSources()
      ); // eslint-disable-line
      await this.obs.on(
        'SceneItemRemoved',
        async () => this.getSceneSources()
      ); // eslint-disable-line
      await this.getSceneSources();
    }
  }

  disconnectOBS() {
    if (!this.obs) {
      return;
    }

    this.obs.disconnect();
  }

  setStatus(value) {
    this.statusOutput.status = value;
    // console.log(`Status changed: ${value}`);
    _.forEach(this.obsPairs, pair => {
      this.obs.send('SetSceneItemProperties', {
        'scene-name': pair.scene,
        item: this.obsSourceName,
        visible: value,
      });
    });
  }

  handleStatusOutput(timeoutLength = 200) {
    const setTimer = () => {
      if (this.statusOutput.timeout) {
        // If we have a timeout, clear it
        clearTimeout(this.statusOutput.timeout);
      }

      this.statusOutput.timeout = setTimeout(() => {
        // If we timeout, set and set status
        this.setStatus(false);
      }, timeoutLength);
    };

    if (this.currentFile.metadata.lastFrame < -60) {
      // Only show the source in the later portion of the game loading stage
      return;
    }

    if (this.statusOutput.status) {
      // If game is currently active, reset the timer
      setTimer();
      return;
    }

    // Here we did not have a game going, so let's indicate we do now
    this.setStatus(true);

    // Set timer
    setTimer();
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
        this.handleStatusOutput();
        break;
      }
    });

    // Update the metadata based on parsed data
    this.slpStream.on(SlpStreamEvent.COMMAND, data => {
      const { command, payload } = data;
      switch (command) {
      case Command.POST_FRAME_UPDATE:
        // Here we need to update some metadata fields
        const { frame, playerIndex, isFollower, internalCharacterId } = payload;
        if (isFollower) {
          // No need to do this for follower
          break;
        }

        // Update frame index
        this.currentFile.metadata.lastFrame = frame;

        // Update character usage
        const prevPlayer =
            _.get(this.currentFile, [
              'metadata',
              'players',
              `${playerIndex}`,
            ]) || {};
        const characterUsage = prevPlayer.characterUsage || {};
        const curCharFrames = characterUsage[internalCharacterId] || 0;
        const player = {
          ...prevPlayer,
          characterUsage: {
            ...characterUsage,
            [internalCharacterId]: curCharFrames + 1,
          },
        };
        this.currentFile.metadata.players[`${playerIndex}`] = player;
        break;
      case Command.GAME_END:
        if (payload.gameEndMethod !== 7) {
          this.handleStatusOutput(700);
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
      metadata: {
        ...clearFileObj.metadata,
        startTime: startTime,
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
      startTime: this.currentFile.metadata.startTime,
      lastFrame: this.currentFile.metadata.lastFrame,
      players: this.currentFile.metadata.players,
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
