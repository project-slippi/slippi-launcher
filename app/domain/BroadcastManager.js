/* eslint-disable no-underscore-dangle */

import log from 'electron-log';
import WebSocket from 'ws';

import { DolphinConnection, Ports, ConnectionEvent, ConnectionStatus } from '@slippi/slippi-js';
import { store } from '../index';
import { SET_DOLPHIN_STATUS, SET_SLIPPI_STATUS } from '../actions/broadcast';
import { displayError } from '../actions/error';

const SLIPPI_SERVER = 'ws://localhost:9898/';

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
// eslint-disable-next-line import/prefer-default-export
export class BroadcastManager {
  constructor() {
    this.socket = null;
    this.connection = new DolphinConnection();
    this.connection.on(ConnectionEvent.STATUS_CHANGE, status => {
      store.dispatch({
        type: SET_DOLPHIN_STATUS,
        status: status,
      });
      // Disconnect from Slippi server when we disconnect from Dolphin
      if (status === ConnectionStatus.DISCONNECTED) {
        this.stop();
      }
    });
    this.connection.on(ConnectionEvent.DATA, (data) => {
      this._handleGameData(data);
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  start() {
    if (this.socket) {
      // We're already connected
      console.log("Skipping websocket connection since we're already connected");
      return;
    }

    // Indicate we're connecting to the Slippi server
    console.log("Attempting to connect to the Slippi server");
    store.dispatch({
      type: SET_SLIPPI_STATUS,
      status: ConnectionStatus.CONNECTING,
    });

    this.socket = new WebSocket(SLIPPI_SERVER);

    this.socket.on('open', () => {
      // We successfully connected to the Slippi server
      store.dispatch({
        type: SET_SLIPPI_STATUS,
        status: ConnectionStatus.CONNECTED,
      });

      // Now try connect to our local Dolphin instance
      this.connection.connect(
        '127.0.0.1',
        Ports.DEFAULT
      );
    });

    this.socket.on('close', () => {
      store.dispatch({
        type: SET_SLIPPI_STATUS,
        status: ConnectionStatus.DISCONNECTED,
      });
      // Clear the socket and disconnect from Dolphin too if we're still connected
      this.socket = null;
      this.connection.disconnect();
    });

    this.socket.on('error', (err) => {
      log.error("[BroadcastManager] Error connecting to Slippi server: ", err);
      const errorAction = displayError(
        'broadcast-global',
        err.message,
      );
      store.dispatch(errorAction);
    });
  }

  stop() {
    if (this.socket) {
      this.socket.close();
    }
  }

  _handleGameData(data) {
    if (this.socket) {
      this.socket.send(data);
    }
  }
}

/* eslint-enable no-underscore-dangle */