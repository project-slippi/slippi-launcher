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
    this.connectionStatus = ConnectionStatus.DISCONNECTED;

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`);

    // Initialize SlpFileWriter for writting files
    this.slpFileWriter = new SlpFileWriter(
      this.targetFolder, this.fileStateChangeHandler
    );
  }

  fileStateChangeHandler = () => {
    store.dispatch(connectionStateChanged());
  }

  getSettings() {
    return {
      ipAddress: this.ipAddress,
      targetFolder: this.targetFolder,
      isRealTimeMode: this.isRealTimeMode,
    };
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
    store.dispatch(connectionStateChanged());

    const client = net.connect({
      host: this.ipAddress,
      port: 666,
    }, () => {
      console.log(`Connected to ${this.ipAddress}!`);
      this.connectionStatus = ConnectionStatus.CONNECTED;
      store.dispatch(connectionStateChanged());
    });

    client.setTimeout(10000);
    
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
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      store.dispatch(connectionStateChanged());
      // TODO: Handle auto-reconnect logic
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      store.dispatch(connectionStateChanged());
    });

    client.on('end', () => {
      console.log('disconnect');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      store.dispatch(connectionStateChanged());
    });
  }

  async startMirroring() {
    try {
      console.log("Mirroring start");
      this.isMirroring = true;
      store.dispatch(connectionStateChanged());
      await this.dolphinManager.startPlayback();
    } finally {
      console.log("Mirroring end");
      this.isMirroring = false;
      store.dispatch(connectionStateChanged());
    }
  }
}
