import net from 'net';
import _ from 'lodash';
import log from 'electron-log';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';
import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';
import ConsoleCommunication, { types as commMsgTypes } from './ConsoleCommunication';

export const ConnectionStatus = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  RECONNECTING: 3,
};

export default class ConsoleConnection {
  static connectionCount = 0;

  constructor(settings = {}) {
    ConsoleConnection.connectionCount += 1;

    this.id = ConsoleConnection.connectionCount;
    this.ipAddress = settings.ipAddress;
    this.port = settings.port;
    this.targetFolder = settings.targetFolder;
    this.obsIP = settings.obsIP;
    this.obsSourceName = settings.obsSourceName;
    this.obsPassword = settings.obsPassword;
    this.isRealTimeMode = settings.isRealTimeMode;
    this.isRelaying = settings.isRelaying;

    this.isMirroring = false;
    this.client = null;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connDetails = {
      gameDataCursor: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]), 
      consoleNick: "unknown", 
      version: "",
      clientToken: 0,
    }
    this.connectionRetryState = this.getDefaultRetryState();

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`, { mode: 'mirror' });

    // Initialize SlpFileWriter for writting files
    const slpSettings = {targetFolder: this.targetFolder, 
      onFileStateChange: this.fileStateChangeHandler, 
      obsIP: this.obsIP, obsSourceName: this.obsSourceName,
      obsPassword: this.obsPassword, id: this.id,
      isRelaying: this.isRelaying,
    }
    this.slpFileWriter = new SlpFileWriter(slpSettings);
  }

  forceConsoleUiUpdate() {
    store.dispatch(connectionStateChanged());
  }
  
  fileStateChangeHandler = () => {
    this.forceConsoleUiUpdate();
  }

  getSettings() {
    return {
      id: this.id,
      ipAddress: this.ipAddress,
      port: this.port,
      targetFolder: this.targetFolder,
      obsIP: this.obsIP,
      obsSourceName: this.obsSourceName,
      obsPassword: this.obsPassword,
      isRealTimeMode: this.isRealTimeMode,
      isRelaying: this.isRelaying,
      consoleNick: this.connDetails.consoleNick,
    };
  }

  getDefaultRetryState() {
    return {
      retryCount: 0,
      retryWaitMs: 1000,
      reconnectHandler: null,
    }
  }

  startReconnect() {
    const retryState = this.connectionRetryState;
    if (retryState.retryCount >= 5) {
      // Stop reconnecting after 5 attempts
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.forceConsoleUiUpdate();
      return;
    }

    const waitTime = retryState.retryWaitMs;
    console.log(`Setting reconnect handler with time: ${waitTime}ms`);
    const reconnectHandler = setTimeout(() => {
      console.log(`Trying to reconnect after waiting: ${waitTime}ms`);
      this.connect();
    }, retryState.retryWaitMs);

    // Prepare next retry state
    this.connectionRetryState = {
      ...retryState,
      retryCount: retryState.retryCount + 1,
      retryWaitMs: retryState.retryWaitMs * 2,
      reconnectHandler: reconnectHandler,
    };

    this.connectionStatus = ConnectionStatus.RECONNECTING;
    this.forceConsoleUiUpdate();
  }

  editSettings(newSettings) {
    // If data is not provided, keep old values
    this.ipAddress = newSettings.ipAddress || this.ipAddress;
    this.port = newSettings.port || this.port;
    this.targetFolder = newSettings.targetFolder || this.targetFolder;
    this.obsIP = newSettings.obsIP || this.obsIP;
    this.obsSourceName = newSettings.obsSourceName || this.obsSourceName;
    this.obsPassword = newSettings.obsPassword || this.obsPassword;
    this.isRealTimeMode = _.defaultTo(newSettings.isRealTimeMode, this.isRealTimeMode);
    this.isRelaying = _.defaultTo(newSettings.isRelaying, this.isRelaying);
  }

  getDolphinManager() {
    return this.dolphinManager;
  }

  connect() {
    // We need to update settings here in order for any
    // changes to settings to be propagated

    // Update dolphin manager settings
    const connectionSettings = this.getSettings();
    this.slpFileWriter.updateSettings(connectionSettings);
    this.slpFileWriter.connectOBS();
    this.dolphinManager.updateSettings(connectionSettings);

    // Indicate we are connecting
    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.forceConsoleUiUpdate();

    // Prepare console communication obj for talking UBJSON
    const consoleComms = new ConsoleCommunication();

    // TODO: reconnect on failed reconnect, not sure how
    // TODO: to do this
    const client = net.connect({
      host: this.ipAddress,
      port: this.port || 666,
    }, () => {
      console.log(`Connected to ${this.ipAddress}:${this.port || "666"}!`);
      clearTimeout(this.connectionRetryState.reconnectHandler);
      this.connectionRetryState = this.getDefaultRetryState();
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.forceConsoleUiUpdate();

      const handshakeMsgOut = consoleComms.genHandshakeOut(
        this.connDetails.gameDataCursor, this.connDetails.clientToken
      );

      // console.log({
      //   'raw': handshakeMsgOut,
      //   'string': handshakeMsgOut.toString(),
      //   'cursor': this.connDetails.gameDataCursor,
      // });
      client.write(handshakeMsgOut);
    });

    client.setTimeout(20000);

    let commState = "initial";
    client.on('data', (data) => {
      if (commState === "initial") {
        commState = this.getInitialCommState(data);
        log.info(`Connected to source with type: ${commState}`);
        log.info(data.toString("hex"));
      }
      
      if (commState === "legacy") {
        // If the first message received was not a handshake message, either we
        // connected to an old Nintendont version or a relay instance
        this.handleReplayData(data);
        return;
      }

      consoleComms.receive(data);
      const messages = consoleComms.getMessages();

      // Process all of the received messages
      _.forEach(messages, message => this.processMessage(message));
    });

    client.on('timeout', () => {
      // const previouslyConnected = this.connectionStatus === ConnectionStatus.CONNECTED;
      console.log(`Timeout on ${this.ipAddress}:${this.port || "666"}`);
      client.destroy();

      // TODO: Fix reconnect logic
      // if (this.connDetails.token !== "0x00000000") {
      //   // If previously connected, start the reconnect logic
      //   this.startReconnect();
      // }
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
    });

    client.on('end', () => {
      console.log('disconnect');
      client.destroy();
    });

    client.on('close', () => {
      console.log('connection was closed');
      this.client = null;
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.forceConsoleUiUpdate();

      // TODO: Fix reconnect logic
      // // After attempting first reconnect, we may still fail to connect, we should keep
      // // retrying until we succeed or we hit the retry limit
      // if (this.connectionRetryState.retryCount) {
      //   this.startReconnect();
      // }
    });

    this.client = client;
  }

  disconnect() {
    const reconnectHandler = this.connectionRetryState.reconnectHandler;
    if (reconnectHandler) {
      clearTimeout(reconnectHandler);
    }

    if (this.client) {
      // TODO: Confirm destroy is picked up by an action and disconnected
      // TODO: status is set
      this.slpFileWriter.disconnectOBS();
      this.client.destroy();
    }
  }

  getInitialCommState(data) {
    if (data.length < 13) {
      return "legacy";
    }

    const openingBytes = Buffer.from([
      0x7b, 0x69, 0x04, 0x74, 0x79, 0x70, 0x65, 0x55, 0x01,
    ]);

    const dataStart = data.slice(4, 13);
    
    return dataStart.equals(openingBytes) ? "normal" : "legacy";
  }

  processMessage(message) {
    switch (message.type) {
    case commMsgTypes.KEEP_ALIVE:
      // console.log("Keep alive message received");

      // TODO: This is the jankiest shit ever but it will allow for relay connections not
      // TODO: to time out as long as the main connection is still receving keep alive messages
      // TODO: Need to figure out a better solution for this. There should be no need to have an
      // TODO: active Wii connection for the relay connection to keep itself alive
      const fakeKeepAlive = Buffer.from("HELO\0");
      this.slpFileWriter.handleData(fakeKeepAlive);
      
      break;
    case commMsgTypes.REPLAY:
      // console.log("Replay message type received");
      // console.log(message.payload.pos);
      this.connDetails.gameDataCursor = Uint8Array.from(message.payload.pos);

      const data = Uint8Array.from(message.payload.data);
      this.handleReplayData(data);
      break;
    case commMsgTypes.HANDSHAKE:
      // console.log("Handshake message received");
      // console.log(message);

      this.connDetails.consoleNick = message.payload.nick;
      const tokenBuf = Buffer.from(message.payload.clientToken);
      this.connDetails.clientToken = tokenBuf.readUInt32BE(0);;
      // console.log(`Received token: ${this.connDetails.clientToken}`);

      // Update file writer to use new console nick?
      this.slpFileWriter.updateSettings(this.getSettings());
      break;
    default:
      // Should this be an error?
      break;
    }
  }

  handleReplayData(data) {
    const result = this.slpFileWriter.handleData(data);
    if (result.isNewGame) {
      const curFilePath = this.slpFileWriter.getCurrentFilePath();
      this.dolphinManager.playFile(curFilePath, false);
    }
  }

  async startMirroring() {
    try {
      console.log("Mirroring start");
      this.isMirroring = true;
      this.forceConsoleUiUpdate();
      await this.dolphinManager.startPlayback();
    } finally {
      console.log("Mirroring end");
      this.isMirroring = false;
      this.forceConsoleUiUpdate();
    }
  }
}
