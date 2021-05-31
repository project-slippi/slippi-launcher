/*

Copyright (C) 2020 JLaferri <https://slippi.gg/>

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program; if not, write to the Free Software Foundation,
Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/


import _ from 'lodash';

import { Ports, DolphinConnection, ConsoleConnection, ConnectionStatus } from '@slippi/slippi-js';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';
import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';

export default class SlpNetworking {
  static connectionCount = 0;

  constructor(settings = {}) {
    SlpNetworking.connectionCount += 1;

    this.id = SlpNetworking.connectionCount;
    this.ipAddress = settings.ipAddress;
    this.port = settings.port;
    this.folderPath = settings.folderPath;
    this.obsIP = settings.obsIP;
    this.obsSourceName = settings.obsSourceName;
    this.obsPassword = settings.obsPassword;
    this.isRealTimeMode = settings.isRealTimeMode;
    this.isRelaying = settings.isRelaying;

    this.isMirroring = false;
    this.connections = [];
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connDetails = this.getDefaultConnDetails();

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`, { mode: 'mirror' });

    // Initialize SlpFileWriter for writting files
    const slpSettings = {folderPath: this.folderPath, 
      onFileStateChange: this.fileStateChangeHandler, 
      obsIP: this.obsIP, obsSourceName: this.obsSourceName,
      obsPassword: this.obsPassword, id: this.id,
      isRelaying: this.isRelaying,
    }
    this.slpFileWriter = new SlpFileWriter(slpSettings);
    this.slpFileWriter.on("new-file", (curFilePath) => {
      this.dolphinManager.playFile(curFilePath, false);
    })
  }

  forceConsoleUiUpdate() {
    store.dispatch(connectionStateChanged());
  }
  
  fileStateChangeHandler = () => {
    this.forceConsoleUiUpdate();
  }

  getDefaultConnDetails() {
    return {
      gameDataCursor: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]), 
      consoleNick: "unknown", 
      version: "",
      clientToken: 0,
    };
  }

  getSettings() {
    return {
      id: this.id,
      ipAddress: this.ipAddress,
      port: this.port,
      folderPath: this.folderPath,
      obsIP: this.obsIP,
      obsSourceName: this.obsSourceName,
      obsPassword: this.obsPassword,
      isRealTimeMode: this.isRealTimeMode,
      isRelaying: this.isRelaying,
      consoleNick: this.connDetails.consoleNick,
    };
  }

  editSettings(newSettings) {
    // If data is not provided, keep old values
    this.ipAddress = newSettings.ipAddress || this.ipAddress;
    this.port = newSettings.port || this.port;
    this.folderPath = newSettings.folderPath || this.folderPath;
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
    this.setStatus(ConnectionStatus.CONNECTING);
    // Update dolphin manager settings
    const connectionSettings = this.getSettings();
    this.slpFileWriter.updateSettings(connectionSettings);
    this.slpFileWriter.connectOBS();
    this.dolphinManager.updateSettings(connectionSettings);

    if (this.port && this.port !== Ports.LEGACY && this.port !== Ports.DEFAULT) {
      // If port is manually set, use that port. Don't do this if the port is set to legacy as
      // somebody might have accidentally set it to that and they would encounter issues with
      // the new Nintendont
      this.connectOnPort(this.port);
    } else {
      // Try both the default and legacy ports
      this.connectOnPort(Ports.DEFAULT);
      this.connectOnPort(Ports.LEGACY);

      // Also try to connect as a Dolphin instance
      this.connectOnPort(Ports.DEFAULT, "dolphin");
    }
  }

  connectOnPort(port, connectionType="console") {
    let conn;
    if (connectionType === "console") {
      conn = new ConsoleConnection();
    } else {
      conn = new DolphinConnection();
    }
    // Only add the event listeners once we've connected
    conn.once("connect", () => {
      conn.on("handshake", (details) => {
        console.log(details);
        this.connDetails = {...this.connDetails, ...details};
        console.log(this.connDetails);
        this.forceConsoleUiUpdate();
      });
      conn.on("statusChange", (status) => this.setStatus(status));
      conn.on("data", (data) => this.handleReplayData(data));
    });
    this.connections.push(conn);
    // Actually try to connect
    console.log(`Connecting to: ${this.ipAddress}:${port}`);
    conn.connect(this.ipAddress, port);
  }

  disconnect() {
    console.log("Disconnect request");

    this.slpFileWriter.disconnectOBS();
    this.connections.forEach((conn) => {
      conn.disconnect();
    });
    this.connections = [];

    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  handleReplayData(data) {
    this.slpFileWriter.handleData(data);
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

  setStatus(status) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.forceConsoleUiUpdate();
    }
  }
}
