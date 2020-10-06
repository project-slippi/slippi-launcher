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
    this.dolphinConnection.on(ConnectionEvent.MESSAGE, (message) => {
      this._handleGameData(message);
    });
    this.dolphinConnection.on(ConnectionEvent.ERROR, (err) => {
      // Log the error messages we get from Dolphin
      log.error(err);
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  async start(password) {
    if (this.wsConnection) {
      // We're already connected
      console.log("Skipping websocket connection since we're already connected");
      return;
    }

    // Indicate we're connecting to the Slippi server
    console.log("Attempting to connect to the Slippi server");
    store.dispatch(setSlippiStatus(ConnectionStatus.CONNECTING));

    const headers = {
      password: password,
    };
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.authorization = `Bearer ${token}`;
    }

    const socket = new WebSocketClient();

    socket.on('connectFailed', (error) => {
      store.dispatch(setSlippiStatus(ConnectionStatus.DISCONNECTED));
      const errorAction = displayError(
        'broadcast-global',
        error.message,
      );
      store.dispatch(errorAction);
    });

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

  _handleGameData(message) {
    if (this.wsConnection) {
      switch (message.type) {
      // Only forward these message types to the server
      case "start_game":
      case "game_event":
      case "end_game":
        // const payloadStart = obj.payload.substring(0, 4);
        // const buf = Buffer.from(payloadStart, 'base64');
        // const command = buf[0];
        // if (command) {
        //   console.log(`[Broadcast] Sending 0x${command.toString(16)}`);
        // } else {
        //   console.log(`[Broadcast] Empty message received? ${JSON.stringify(message)}`);
        // }
        
        this.wsConnection.sendUTF(JSON.stringify(message));
        break;
      default:
        break;
      }
    }
  }
}

/* eslint-enable no-underscore-dangle */