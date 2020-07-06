/*

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>

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

/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

import net from 'net';
import inject from 'reconnect-core';
import _ from 'lodash';
import log from 'electron-log';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';
import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';
import ConsoleCommunication, { types as commMsgTypes } from './ConsoleCommunication';

const enet = require("enet");

export const ConnectionStatus = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  RECONNECT_WAIT: 3,
};

export const Ports = {
  WII_DEFAULT: 51441,
  WII_LEGACY: 666,
  RELAY_START: 53741,
};

const TIMEOUT_MS = 20000;

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
    this.connectionsByPort = [];
    this.clientsByPort = [];
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connDetails = this.getDefaultConnDetails();

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

  getDefaultConnDetails() {
    return {
      gameDataCursor: 0,
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
      targetFolder: this.targetFolder,
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
    // Update dolphin manager settings
    const connectionSettings = this.getSettings();
    this.slpFileWriter.updateSettings(connectionSettings);
    this.slpFileWriter.connectOBS();
    this.dolphinManager.updateSettings(connectionSettings);

    // if (this.port && this.port !== Ports.WII_LEGACY && this.port !== Ports.WII_DEFAULT) {
    //   // If port is manually set, use that port. Don't do this if the port is set to legacy as
    //   // somebody might have accidentally set it to that and they would encounter issues with
    //   // the new Nintendont
    //   this.connectOnPort(this.port);
    //   return;
    // }

    this.connectToSpectate();
    this.connectOnPort(Ports.WII_DEFAULT);
    this.connectOnPort(Ports.WII_LEGACY);
  }

  connectToSpectate() {
    this.client = enet.createServer({
      address: {address:"0.0.0.0", port:14415}, /* the address the server host will bind to */
      peers:32, /* allow up to 32 clients and/or outgoing connections */
      channels:3,
      down:0,
      up:0,
    }, (err, _host) => {
      if(err){
        console.error("For now, you can only spectate one game at a time, sorry!");
      }
    });

    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.forceConsoleUiUpdate();

    /* Initiate the connection, allocating the two channels 0 and 1. */
    this.peer = this.client.connect(
      {address:this.ipAddress, port:51441},
      3, /* channels */
      1337, /* data to send, (received in 'connect' event at server) */
      (err, newPeer) => { /* a connect callback function */
        if(err){
          console.error(err); // either connect timeout or maximum peers exceeded
          return;
        }
        // connection to the remote host succeeded
        newPeer.ping();
	   });

    // succesful connect event can also be handled with an event handler
    this.peer.on("connect", () => {

      const connectRequest = {
        "type" : "connect_request",
        "cursor" : this.connDetails.gameDataCursor,
      };

      const packet = new enet.Packet(JSON.stringify(connectRequest), enet.PACKET_FLAG.RELIABLE);
      this.peer.send(0, packet);
    });

    // incoming peer connection
    this.peer.on("message", (packet, _channel) => {
      if(packet.data().length === 0){
        return;
      }

      const message = JSON.parse(packet.data().toString('ascii'));
      if(message["type"] === "connect_reply") {

        this.connDetails.clientToken = 0;
        this.connDetails.gameDataCursor = message["cursor"];
        this.connDetails.consoleNick = message["nick"];
        this.connDetails.version = message["version"];
        this.connectionStatus = ConnectionStatus.CONNECTED;

        this.forceConsoleUiUpdate();
        this.slpFileWriter.updateSettings(this.getSettings());
      }
      else if(message["type"] === "game_event") {
        // Handle incoming game event
        const cursor = message["cursor"];
        if (this.connDetails.gameDataCursor !== cursor) {
          log.warn(
            "Position of received data is not what was expected. Expected, Received:",
            this.connDetails.gameDataCursor, cursor
          );

          // The readPos is not the one we are waiting on, throw error
          throw new Error("Position of received data is incorrect.");
        }

        this.connDetails.gameDataCursor = message["next_cursor"];
        this.handleReplayData(Buffer.from(message["payload"], 'base64'));
      }

    });

    this.peer.on("disconnect", (_data) => {
      this.client.destroy();

      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.forceConsoleUiUpdate();
    });

  }

  connectOnPort(port) {
    // Set up reconnect
    const reconnect = inject(() => (
      net.connect({
        host: this.ipAddress,
        port: port,
        timeout: TIMEOUT_MS,
      })
    ));

    const connection = reconnect({
      initialDelay: 2000,
      maxDelay: 10000,
      strategy: 'fibonacci',
      failAfter: Infinity,
    }, (client) => {
      this.clientsByPort[port] = client;

      // Prepare console communication obj for talking UBJSON
      const consoleComms = new ConsoleCommunication();

      console.log(`Connected to ${this.ipAddress}:${port}!`);
      this.connectionStatus = ConnectionStatus.CONNECTED;

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

        try {
          consoleComms.receive(data);
        } catch (err) {
          log.error("Failed to process new data from server...", {
            error: err,
            prevDataBuf: consoleComms.getReceiveBuffer(),
            rcvData: data,
          });
          client.destroy();

          return;
        }

        const messages = consoleComms.getMessages();

        // Process all of the received messages
        try {
          _.forEach(messages, message => this.processMessage(message));
        } catch {
          // Disconnect client to send another handshake message
          client.destroy();
        }
      });

      client.on('timeout', () => {
        // const previouslyConnected = this.connectionStatus === ConnectionStatus.CONNECTED;
        console.log(`Timeout on ${this.ipAddress}:${port}`);
        client.destroy();
      });

      client.on('end', () => {
        console.log('client end');
        client.destroy();
      });

      client.on('close', () => {
        console.log('connection was closed');
      });

      const handshakeMsgOut = consoleComms.genHandshakeOut(
        this.connDetails.gameDataCursor, this.connDetails.clientToken, this.isRealTimeMode
      );

      // Clear nick and version. Will be fetched again
      const defaultConnDetails = this.getDefaultConnDetails();
      this.connDetails.consoleNick = defaultConnDetails.consoleNick;
      this.connDetails.version = defaultConnDetails.version;

      this.forceConsoleUiUpdate();

      // console.log({
      //   'raw': handshakeMsgOut,
      //   'string': handshakeMsgOut.toString(),
      //   'cursor': this.connDetails.gameDataCursor,
      // });
      client.write(handshakeMsgOut);
    });

    const setConnectingStatus = () => {
      // Indicate we are connecting
      this.connectionStatus = ConnectionStatus.CONNECTING;
      this.forceConsoleUiUpdate();
    };

    connection.on('connect', setConnectingStatus);
    connection.on('reconnect', setConnectingStatus);

    connection.on('disconnect', () => {
      // If one of the connections was successful, we no longer need to try connecting this one
      this.connectionsByPort.forEach((iConn, iPort) => {
        if (iPort === port || !iConn.connected) {
          // Only disconnect if a different connection was connected
          return;
        }

        // Prevent reconnections and disconnect
        connection.reconnect = false; // eslint-disable-line
        connection.disconnect();
      });

      // TODO: Figure out how to set RECONNECT_WAIT state here. Currently it will stay on
      // TODO: Connecting... forever
    });

    connection.on('error', (error) => {
      log.warn(`Connection on port ${port} encountered an error.`, error)
    });

    this.connectionsByPort[port] = connection;
    connection.connect();
  }

  disconnect() {
    console.log("Disconnect request");

    this.slpFileWriter.disconnectOBS();

    this.connectionsByPort.forEach((connection) => {
      // Prevent reconnections and disconnect
      connection.reconnect = false; // eslint-disable-line
      connection.disconnect();
    });

    this.clientsByPort.forEach((client) => {
      client.destroy();
    });

    // A disconnect event will fire on the peer when this completes
    this.peer.disconnect();
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
      const readPos = Uint8Array.from(message.payload.pos);
      const cmp = Buffer.compare(this.connDetails.gameDataCursor, readPos);
      if (!message.payload.forcePos && cmp !== 0) {
        log.warn(
          "Position of received data is not what was expected. Expected, Received:",
          this.connDetails.gameDataCursor, readPos
        );

        // The readPos is not the one we are waiting on, throw error
        throw new Error("Position of received data is incorrect.");
      }

      if (message.payload.forcePos) {
        log.warn(
          "Overflow occured in Nintendont, data has likely been skipped and replay corrupted. " +
          "Expected, Received:", this.connDetails.gameDataCursor, readPos
        );
      }

      this.connDetails.gameDataCursor = Uint8Array.from(message.payload.nextPos);

      const data = Uint8Array.from(message.payload.data);
      this.handleReplayData(data);
      break;
    case commMsgTypes.HANDSHAKE:
      console.log("Handshake message received");
      console.log(message);

      this.connDetails.consoleNick = message.payload.nick;
      const tokenBuf = Buffer.from(message.payload.clientToken);
      this.connDetails.clientToken = tokenBuf.readUInt32BE(0);
      this.connDetails.version = message.payload.nintendontVersion;
      this.connDetails.gameDataCursor = Uint8Array.from(message.payload.pos);
      // console.log(`Received token: ${this.connDetails.clientToken}`);

      this.forceConsoleUiUpdate();

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
