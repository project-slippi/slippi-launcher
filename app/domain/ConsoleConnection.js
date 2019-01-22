import net from 'net';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';
import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';

export const ConnectionStatus = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  RECONNECTING: 2,
};

export default class ConsoleConnection {
  static connectionCount = 0;

  constructor(settings = {}) {
    ConsoleConnection.connectionCount += 1;

    this.id = ConsoleConnection.connectionCount;
    this.ipAddress = settings.ipAddress;
    this.targetFolder = settings.targetFolder;

    this.isMirroring = false;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`);

    // SlpFileWriter for writting files
    this.slpFileWriter = new SlpFileWriter(this.targetFolder);
  }

  getSettings() {
    return {
      ipAddress: this.ipAddress,
      targetFolder: this.targetFolder,
    };
  }

  editSettings(newSettings) {
    // If data is not provided, keep old values
    this.ipAddress = newSettings.ipAddress || this.ipAddress;
    this.targetFolder = newSettings.targetFolder || this.targetFolder;
  }

  getDolphinManager() {
    return this.dolphinManager;
  }

  connect() {
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
      if (result.isNewGame && this.isMirroring) {
        const curFilePath = this.slpFileWriter.getCurrentFilePath();
        this.dolphinManager.playFile(curFilePath);
      }

      if (result.isNewGame || result.isGameEnd) {
        store.dispatch(connectionStateChanged());
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
