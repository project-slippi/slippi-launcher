import net from 'net';

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
  }

  getSettings() {
    return {
      ipAddress: this.ipAddress,
      targetFolder: this.targetFolder,
    };
  }

  editSettings(newSettings) {
    this.ipAddress = newSettings.ipAddress;
    this.targetFolder = newSettings.targetFolder;
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
    });

    client.setTimeout(10000);

    // Prepare SlpFileWriter class
    const slpFileWriter = new SlpFileWriter(this.targetFolder);
    
    client.on('data', (data) => {
      const result = slpFileWriter.handleData(data);
      if (result.isNewGame && this.isMirroring) {
        this.dolphinManager.playFile(slpFileWriter.getCurrentFilePath());
      }
    });

    client.on('timeout', () => {
      console.log(`Timeout on ${this.ipAddress}`);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      // TODO: Handle auto-reconnect logic
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
    });

    client.on('end', () => {
      console.log('disconnect');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
    });
  }

  async startMirroring() {
    try {
      console.log("Mirroring start");
      this.isMirroring = true;
      await this.dolphinManager.startPlayback();
    } finally {
      console.log("Mirroring end");
      this.isMirroring = false;
    }
  }
}
