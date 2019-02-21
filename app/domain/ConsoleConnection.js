import net from 'net';
import _ from 'lodash';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';
import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';

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
    this.targetFolder = settings.targetFolder;
    this.isRealTimeMode = settings.isRealTimeMode;

    this.isMirroring = false;
    this.client = null;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connectionRetryState = this.getDefaultRetryState();

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`);

    // Initialize SlpFileWriter for writting files
    this.slpFileWriter = new SlpFileWriter(
      this.targetFolder, this.fileStateChangeHandler
    );
  }

  forceConsoleUiUpdate() {
    store.dispatch(connectionStateChanged());
  }
  
  fileStateChangeHandler = () => {
    this.forceConsoleUiUpdate();
  }

  getSettings() {
    return {
      ipAddress: this.ipAddress,
      targetFolder: this.targetFolder,
      isRealTimeMode: this.isRealTimeMode,
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

    const reconnectHandler = setTimeout(() => {
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
    this.targetFolder = newSettings.targetFolder || this.targetFolder;
    this.isRealTimeMode = _.defaultTo(newSettings.isRealTimeMode, this.isRealTimeMode);
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
    this.dolphinManager.updateSettings(connectionSettings);

    // Indicate we are connecting
    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.forceConsoleUiUpdate();

    // TODO: reconnect on failed reconnect, not sure how
    // TODO: to do this
    const client = net.connect({
      host: this.ipAddress,
      port: 666,
    }, () => {
      console.log(`Connected to ${this.ipAddress}!`);
      this.connectionRetryState = this.getDefaultRetryState();
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.forceConsoleUiUpdate();
    });

    client.setTimeout(15000);
    
    client.on('data', (data) => {
      const result = this.slpFileWriter.handleData(data);
      if (result.isNewGame) {
        const curFilePath = this.slpFileWriter.getCurrentFilePath();
        this.dolphinManager.playFile(curFilePath, false);
      }
    });

    client.on('timeout', () => {
      console.log(`Timeout on ${this.ipAddress}`);
      client.destroy();

      // TODO: Does timeout only happen after a successful connect?
      // TODO: if so this functino will never return false
      this.startReconnect();
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      this.forceConsoleUiUpdate();
    });

    client.on('end', () => {
      console.log('disconnect');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      this.forceConsoleUiUpdate();
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
      this.client.destroy();
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
