/* eslint-disable no-underscore-dangle */

import log from 'electron-log';
import { client as WebSocketClient } from 'websocket';
import * as firebase from 'firebase';

import { DolphinConnection, Ports, ConnectionEvent, ConnectionStatus } from '@slippi/slippi-js';
import { store } from '../index';
import { setDolphinStatus, setSlippiStatus } from '../actions/broadcast';
import { displayError } from '../actions/error';

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
// eslint-disable-next-line import/prefer-default-export
export class BroadcastManager {
  constructor() {
    this.wsConnection = null;
    this.dolphinConnection = new DolphinConnection();
    this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, status => {
      store.dispatch(setDolphinStatus(status));
      // Disconnect from Slippi server when we disconnect from Dolphin
      if (status === ConnectionStatus.DISCONNECTED) {
        this.stop();
      }
    });
    this.dolphinConnection.on(ConnectionEvent.DATA, (data) => {
      this._handleGameData(data);
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  async start() {
    if (this.wsConnection) {
      // We're already connected
      console.log("Skipping websocket connection since we're already connected");
      return;
    }

    // Indicate we're connecting to the Slippi server
    console.log("Attempting to connect to the Slippi server");
    store.dispatch(setSlippiStatus(ConnectionStatus.CONNECTING));

    const headers = {};
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.authorization = `Bearer ${token}`;
    }

    console.log(headers);

    const socket = new WebSocketClient();

    socket.on('connect', (connection) => {
      this.wsConnection = connection;

      // We successfully connected to the Slippi server
      store.dispatch(setSlippiStatus(ConnectionStatus.CONNECTED));

      // Now try connect to our local Dolphin instance
      this.dolphinConnection.connect(
        '127.0.0.1',
        Ports.DEFAULT
      );

      connection.on('error', (err) => {
        log.error("[BroadcastManager] Error connecting to Slippi server: ", err);
        const errorAction = displayError(
          'broadcast-global',
          err.message,
        );
        store.dispatch(errorAction);
      });

      connection.on('close', () => {
        store.dispatch(setSlippiStatus(ConnectionStatus.DISCONNECTED));

        // Clear the socket and disconnect from Dolphin too if we're still connected
        this.wsConnection = null;
        this.dolphinConnection.disconnect();
      });
    });

    socket.connect(SLIPPI_WS_SERVER, 'broadcast-protocol', undefined, headers);
  }

  stop() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  }

  _handleGameData(data) {
    if (this.wsConnection) {
      console.log(data);
      this.wsConnection.sendUTF(JSON.stringify(data));
    }
  }
}

/* eslint-enable no-underscore-dangle */