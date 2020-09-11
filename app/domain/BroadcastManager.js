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
      switch(status) {
      case ConnectionStatus.CONNECTED:
        this._connectToSlippiServer();
        break;
      case ConnectionStatus.DISCONNECTED:
        this._disconnectFromSlippiServer();
        break;
      default:
        break;
      }
    });
    this.connection.on(ConnectionEvent.DATA, (data) => {
      this._handleGameData(data);
    });
  }

  /**
   * Connects to Dolphin and the Slippi server, forwarding data from Dolphin to Slippi
   */
  start() {
    this.connection.connect(
      '127.0.0.1',
      Ports.DEFAULT
    );
  }

  stop() {
    this.connection.disconnect();
  }

  _handleGameData(data) {
    if (this.socket) {
      this.socket.send(data);
    }
  }

  _connectToSlippiServer() {
    if (this.socket) {
      // We're already connected
      console.log("skipping websocket connection since we're already connected");
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
      store.dispatch({
        type: SET_SLIPPI_STATUS,
        status: ConnectionStatus.CONNECTED,
      });
    });
    this.socket.on('close', () => {
      store.dispatch({
        type: SET_SLIPPI_STATUS,
        status: ConnectionStatus.DISCONNECTED,
      });
      // Clear the socket
      console.log("clearing the socket");
      this.socket = null;
      // Disconnect from Dolphin too if we're still connected
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

  _disconnectFromSlippiServer() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

/* eslint-enable no-underscore-dangle */