import net from 'net';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import OBSWebSocket from 'obs-websocket-js'

export default class SlpFileWriter {
  static commands = {
    CMD_RECEIVE_COMMANDS: 0x35,
    CMD_GAME_START: 0x36,
    CMD_RECEIVE_POST_FRAME_UPDATE: 0x38,
    CMD_RECEIVE_GAME_END: 0x39,
  }

  constructor(settings) {
    this.folderPath = settings.folderPath;
    this.onFileStateChange = settings.onFileStateChange;
    this.obsSourceName = settings.obsSourceName;
    this.obsIP = settings.obsIP;
    this.id = settings.id;
    this.currentFile = this.getClearedCurrentFile();
    this.obs = new OBSWebSocket();
    this.statusOutput = {
      status: false,
      timeout: null,
    };
    this.isRelaying = settings.isRelaying;
    this.clients = [];
    if (this.isRelaying) {
      this.startRelay();
    }
  }

  getClearedCurrentFile() {
    return {
      payloadSizes: {},
      previousBuffer: Buffer.from([]),
      path: null,
      writeStream: null,
      bytesWritten: 0,
      metadata: {
        startTime: null,
        lastFrame: -124,
        players: {},
      },
    };
  }

  startRelay = () => {
    if (!this.isRelaying) {
      if (this.clients) {
        _.each(this.clients, (client) => client.destroy());
      }
      if (this.server) {
        this.server.close();
      }
      this.server = null;
      this.clients = [];
    } else if (!this.server) {
      this.server = net.createServer((socket) => {
        this.clients.push(socket.setNoDelay().setTimeout(10000));
        socket.on("close", (err) => {
          if (err) console.log(err);
          _.remove(this.clients, (client) => socket === client);
        });
      });
      this.server.listen(666 + this.id, '0.0.0.0');
    }
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
    this.startRelay();
  }

  getSceneSources = async (data = null) => { // eslint-disable-line
    const res = await this.obs.send("GetSceneList");
    const scenes = res.scenes || [];
    const pairs = _.flatMap(scenes, (scene) => {
      const sources = scene.sources || [];
      return _.map(sources, (source) => ({scene: scene.name, source: source.name}));
    });
    this.obsPairs = _.filter(pairs, (pair) => pair.source === this.obsSourceName);
  }

  async connectOBS() {
    if (this.obsIP && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      await this.obs.connect({address: this.obsIP, password: this.obsPassword});
      await this.getSceneSources();
    }
  }

  disconnectOBS() {
    this.obs.disconnect();
  }

  setStatus(value) {
    this.statusOutput.status = value;
    console.log(`Status changed: ${value}`);
    _.forEach(this.obsPairs, (pair) => {
      this.obs.send("SetSceneItemProperties", 
        {"scene-name": pair.scene, "item": this.obsSourceName, "visible": value});
    });
  }

  handleStatusOutput(timeoutLength = 100) {
    const setTimer = () => {
      if (this.statusOutput.timeout) {
        // If we have a timeout, clear it
        clearTimeout(this.statusOutput.timeout);
      }

      this.statusOutput.timeout = setTimeout(() => {
        // If we timeout, set and set status
        this.setStatus(false);
      }, timeoutLength);
    }

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
    let isNewGame = false;
    let isGameEnd = false;

    const data = Uint8Array.from(Buffer.concat([
      this.currentFile.previousBuffer,
      newData,
    ]));

    if (this.clients) {
      _.each(this.clients, (client) => client.write(newData));
    }

    const dataView = new DataView(data.buffer);

    let index = 0;
    while (index < data.length) {
      if (Buffer.from(data.slice(index, index + 5)).toString() === "HELO\0") {
        // This is a consequence of the way our network communication works, "HELO" messages are
        // sent periodically to avoid the timeout logic. Just ignore them.
        index += 5;
        continue;
      }

      // TODO: Here we are parsing slp file data. Seems pretty silly to do this when
      // TODO: logic already exists in the parser to do it... Should eventually reconcile
      // TODO: the two.

      // Make sure we have enough data to read a full payload
      const command = dataView.getUint8(index);
      const payloadSize = _.get(this.currentFile, ['payloadSizes', command]) || 0;
      const remainingLen = data.length - index;
      if (remainingLen < payloadSize + 1) {
        // If remaining length is not long enough for full payload, save the remaining
        // data until we receive more data. The data has been split up.
        this.currentFile.previousBuffer = data.slice(index);
        break;
      }

      // Clear previous buffer here, dunno where else to do this
      this.currentFile.previousBuffer = Buffer.from([]);

      // Increment by one for the command byte
      index += 1;

      // Prepare to write payload
      const payloadPtr = data.slice(index);
      const payloadDataView = new DataView(data.buffer, index);
      let payloadLen = 0;

      switch (command) {
      case SlpFileWriter.commands.CMD_RECEIVE_COMMANDS:
        isNewGame = true;
        this.initializeNewGame();
        payloadLen = this.processReceiveCommands(payloadDataView);
        this.writeCommand(command, payloadPtr, payloadLen);
        this.onFileStateChange();
        break;
      case SlpFileWriter.commands.CMD_RECEIVE_GAME_END:
        payloadLen = this.processCommand(command, payloadDataView);
        this.writeCommand(command, payloadPtr, payloadLen);
        this.endGame();
        isGameEnd = true;
        break;
      case SlpFileWriter.commands.CMD_GAME_START:
        payloadLen = this.processCommand(command, payloadDataView);
        this.writeCommand(command, payloadPtr, payloadLen);
        break;
      default:
        payloadLen = this.processCommand(command, payloadDataView);
        this.writeCommand(command, payloadPtr, payloadLen);
        this.handleStatusOutput();
        break;
      }

      index += payloadLen;
    }

    return {
      isNewGame: isNewGame,
      isGameEnd: isGameEnd,
    };
  }

  writeCommand(command, payloadPtr, payloadLen) {
    // Write data
    const writeStream = this.currentFile.writeStream;
    if (!writeStream) {
      return;
    }

    // Keep track of how many bytes we have written to the file
    this.currentFile.bytesWritten += (payloadLen + 1);

    const payloadBuf = payloadPtr.slice(0, payloadLen);
    const bufToWrite = Buffer.concat([
      Buffer.from([command]),
      payloadBuf,
    ]);

    writeStream.write(bufToWrite);
  }

  initializeNewGame() {
    const startTime = moment();
    const filePath = this.getNewFilePath(startTime);
    const writeStream = fs.createWriteStream(filePath, {
      encoding: 'binary',
    });

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

    const header = Buffer.concat([
      Buffer.from("{U"),
      Buffer.from([3]),
      Buffer.from("raw[$U#l"),
      Buffer.from([0, 0, 0, 0]),
    ]);
    writeStream.write(header);

    console.log(`Creating new file at: ${filePath}`);
  }

  getNewFilePath(m) {
    return path.join(this.folderPath, `Game_${m.format("YYYYMMDD")}T${m.format("HHmmss")}.slp`);
  }

  endGame() {
    const writeStream = this.currentFile.writeStream;
    if (!writeStream) {
      // Clear current file
      this.currentFile = this.getClearedCurrentFile();

      return;
    }

    let footer = Buffer.concat([
      Buffer.from("U"),
      Buffer.from([8]),
      Buffer.from("metadata{"),
    ]);

    // Write game start time
    const startTimeStr = this.currentFile.metadata.startTime.toISOString();
    footer = Buffer.concat([
      footer,
      Buffer.from("U"),
      Buffer.from([7]),
      Buffer.from("startAtSU"),
      Buffer.from([startTimeStr.length]),
      Buffer.from(startTimeStr),
    ]);

    // Write last frame index
    // TODO: Get last frame
    const lastFrame = this.currentFile.metadata.lastFrame;
    footer = Buffer.concat([
      footer,
      Buffer.from("U"),
      Buffer.from([9]),
      Buffer.from("lastFramel"),
      this.createInt32Buffer(lastFrame),
    ]);

    // Start writting player specific data
    footer = Buffer.concat([
      footer,
      Buffer.from("U"),
      Buffer.from([7]),
      Buffer.from("players{"),
    ]);
    const players = this.currentFile.metadata.players;
    _.forEach(players, (player, index) => {
      // Start player obj with index being the player index
      footer = Buffer.concat([
        footer,
        Buffer.from("U"),
        Buffer.from([index.length]),
        Buffer.from(`${index}{`),
      ]);

      // Start characters key for this player
      footer = Buffer.concat([
        footer,
        Buffer.from("U"),
        Buffer.from([10]),
        Buffer.from("characters{"),
      ]);

      // Write character usage
      _.forEach(player.characterUsage, (usage, internalId) => {
        // Write this character
        footer = Buffer.concat([
          footer,
          Buffer.from("U"),
          Buffer.from([internalId.length]),
          Buffer.from(`${internalId}l`),
          this.createUInt32Buffer(usage),
        ]);
      });

      // Close characters and player
      footer = Buffer.concat([
        footer,
        Buffer.from("}}"),
      ]);
    });

    // Close players
    footer = Buffer.concat([
      footer,
      Buffer.from("}"),
    ]);

    // Write played on
    footer = Buffer.concat([
      footer,
      Buffer.from("U"),
      Buffer.from([8]),
      Buffer.from("playedOnSU"),
      Buffer.from([7]),
      Buffer.from("network"),
    ]);
    
    // Close metadata and file
    footer = Buffer.concat([
      footer,
      Buffer.from("}}"),
    ]);

    // End the stream
    writeStream.write(footer);
    writeStream.end(null, null, () => {
      // Write bytes written
      const fd = fs.openSync(this.currentFile.path, "r+");
      fs.writeSync(fd, this.createUInt32Buffer(this.currentFile.bytesWritten), 0, "binary", 11);
      fs.closeSync(fd);

      console.log("Finished writting file.");

      // Clear current file
      this.currentFile = this.getClearedCurrentFile();

      // Update file state
      this.onFileStateChange();
    });
  }

  createInt32Buffer(number) {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(number, 0);
    return buf;
  }

  createUInt32Buffer(number) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(number, 0);
    return buf;
  }

  processReceiveCommands(dataView) {
    const payloadLen = dataView.getUint8(0);
    for (let i = 1; i < payloadLen; i += 3) {
      const commandByte = dataView.getUint8(i);
      const payloadSize = dataView.getUint16(i + 1);
      this.currentFile.payloadSizes[commandByte] = payloadSize;
    }

    return payloadLen;
  }

  processCommand(command, dataView) {
    const payloadSize = _.get(this.currentFile, ['payloadSizes', command]);
    if (!payloadSize) {
      // TODO: Flag some kind of error
      return 0;
    }

    switch (command) {
    case SlpFileWriter.commands.CMD_RECEIVE_POST_FRAME_UPDATE:
      // Here we need to update some metadata fields
      const frameIndex = dataView.getInt32(0);
      const playerIndex = dataView.getUint8(4);
      const isFollower = dataView.getUint8(5);
      const internalCharacterId = dataView.getUint8(6);

      if (isFollower) {
        // No need to do this for follower
        break;
      }

      // Update frame index
      this.currentFile.metadata.lastFrame = frameIndex;

      // Update character usage
      const prevPlayer = _.get(this.currentFile, ['metadata', 'players', `${playerIndex}`]) || {};
      const characterUsage = prevPlayer.characterUsage || {};
      const curCharFrames = characterUsage[internalCharacterId] || 0;
      const player = {
        ...prevPlayer,
        "characterUsage": {
          ...characterUsage,
          [internalCharacterId]: curCharFrames + 1,
        },
      };

      this.currentFile.metadata.players[`${playerIndex}`] = player;

      break;
    case SlpFileWriter.commands.CMD_RECEIVE_GAME_END:
      const endMethod = dataView.getUint8(0);

      if (endMethod !== 7) {
        this.handleStatusOutput(700);
      }

      this.getSceneSources();

      break;
    default:
      // Nothing to do
      break;
    }
    return payloadSize;
  }
}
