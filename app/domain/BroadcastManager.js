/* eslint-disable no-underscore-dangle */

import log from 'electron-log';
import { client as WebSocketClient } from 'websocket';
import _ from 'lodash';
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
    this.broadcastId = null;
    this.prevBroadcastId = null;
    this.wsConnection = null;
    this.incomingEvents = [];
    this.deadletterEvents = [];

    this.dolphinConnection = new DolphinConnection();
    this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, status => {
      log.info(`[Broadcast] Dolphin status change: ${status}`);
      store.dispatch(setDolphinStatus(status));
      // Disconnect from Slippi server when we disconnect from Dolphin
      if (status === ConnectionStatus.DISCONNECTED) {
        // Kind of jank but this will hopefully stop the game on the spectator side when someone
        // kills Dolphin. May no longer be necessary after Dolphin itself sends these messages
        this.incomingEvents.push({ type: 'end_game' })
        this._handleGameData();
        this.stop();

        this.incomingEvents = [];
        this.deadletterEvents = [];
      }
    });
    this.dolphinConnection.on(ConnectionEvent.MESSAGE, (message) => {
      this.incomingEvents.push(message)
      this._handleGameData();
    });
    this.dolphinConnection.on(ConnectionEvent.ERROR, (err) => {
      // Log the error messages we get from Dolphin
      log.error("[Broadcast] Dolphin connection error\n", err);
    });

    this._debouncedGameDataLog = _.debounce((cursor, cmd) => {
      // I can't figure out how to differentiate when an invocation is triggered by a leading vs
      // falling edge, would be useful to log that
      log.info(`[Broadcast] Game events edge. ${cursor} 0x${cmd ? cmd.toString(16) : "??"}`);
    }, 1000, {
      leading: true,
      trailing: true,
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  async start(password) {
    if (this.wsConnection) {
      // We're already connected
      return;
    }

    // Indicate we're connecting to the Slippi server
    store.dispatch(setSlippiStatus(ConnectionStatus.CONNECTING));

    const headers = {
      password: password,
      "api-version": 1,
    };
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.authorization = `Bearer ${token}`;
    }

    // Disable nagle because we send a lot of small packets, latency not overly important
    const socket = new WebSocketClient({
      disableNagleAlgorithm: false,
    });

    socket.on('connectFailed', (error) => {
      log.error("[Broadcast] WS failed to connect\n", error);

      const label = "x-websocket-reject-reason: ";
      let message = error.message;
      const pos = error.message.indexOf(label);
      if (pos >= 0) {
        const endPos = error.message.indexOf("\n", pos + label.length);
        message = message.substring(pos + label.length, endPos >= 0 ? endPos : undefined);
      }

      store.dispatch(setSlippiStatus(ConnectionStatus.DISCONNECTED));
      const errorAction = displayError(
        'broadcast-global',
        message,
      );
      store.dispatch(errorAction);
    });

    socket.on('connect', (connection) => {
      log.info("[Broadcast] WS connection successful");

      this.wsConnection = connection;

      const getBroadcasts = async () => {
        connection.sendUTF(JSON.stringify({
          type: "get-broadcasts",
        }));
      };
  
      const startBroadcast = async (broadcastId) => {
        connection.sendUTF(JSON.stringify({
          type: "start-broadcast",
          name: "Netplay",
          broadcastId: broadcastId,
        }));
      };

      const connectionComplete = (broadcastId) => {
        log.info(`[Broadcast] Starting broadcast to: ${broadcastId}`);

        // Get rid of any previously dead events, they should have gotten to incomming events in
        // the situation where it's relevant already
        this.deadletterEvents = [];

        this.broadcastId = broadcastId;
        store.dispatch(setSlippiStatus(ConnectionStatus.CONNECTED));

        // Process any events that may have been missed when we disconnected
        this._handleGameData();
      }

      if (this.dolphinConnection.getStatus() === ConnectionStatus.DISCONNECTED)
      {
        // Now try connect to our local Dolphin instance
        this.dolphinConnection.connect(
          '127.0.0.1',
          Ports.DEFAULT
        );
      }

      connection.on('error', (err) => {
        log.error("[Broadcast] WS connection error encountered\n", err);
        const errorAction = displayError(
          'broadcast-global',
          err.message,
        );
        store.dispatch(errorAction);
      });

      connection.on('close', (code, reason) => {
        log.info(`[Broadcast] WS connection closed: ${code}, ${reason}`);
        store.dispatch(setSlippiStatus(ConnectionStatus.DISCONNECTED));

        // Clear the socket and disconnect from Dolphin too if we're still connected
        this.wsConnection = null;
        
        if (code === 1006) {
          // Here we have an abnormal disconnect... try to reconnect?
          this.start(password);
        } else {
          // If normal close, disconnect from dolphin
          this.dolphinConnection.disconnect();
        }
      });

      connection.on('message', message => {
        if (message.type !== "utf8") {
          return;
        }

        let obj;
        try {
          obj = JSON.parse(message.utf8Data);
        } catch (err) {
          log.error(`[Broadcast] Failed to parse message from server\n`, err, message.utf8Data);
          return;
        }
        
        switch (obj.type) {
        case 'start-broadcast-resp':
          connectionComplete(obj.broadcastId);
          break;
        case 'get-broadcasts-resp':
          const broadcasts = obj.broadcasts || [];

          // Grab broadcastId we were currently using if the broadcast still exists, would happen
          // in the case of a reconnect
          const broadcastsById = _.keyBy(broadcasts, 'id');
          const prevBroadcast = broadcastsById[this.broadcastId];
        
          console.log(broadcastsById);
          console.log(this.broadcastId);
          console.log(prevBroadcast);

          if (prevBroadcast) {
            // Add any events that didn't make it to the server to the front of the event queue
            const sortedRecaptureEvents = _.orderBy(this.deadletterEvents, 'cursor');
            this.incomingEvents = _.concat(sortedRecaptureEvents, this.incomingEvents);
            startBroadcast(prevBroadcast.id);
            return;
          }

          startBroadcast();
          break;
        default:
          log.error(`[Broadcast] Ws resp type ${obj.type} not supported`);
          break;
        }
      });

      getBroadcasts();
    });

    log.info("[Broadcast] Connecting to WS service");
    socket.connect(SLIPPI_WS_SERVER, 'broadcast-protocol', undefined, headers);
  }

  stop() {
    // TODO: Handle cancelling the retry case

    if (this.wsConnection && this.broadcastId)
    {
      this.wsConnection.sendUTF(JSON.stringify({
        type: 'stop-broadcast',
        broadcastId: this.broadcastId,
      }));
  
      log.info("[Broadcast] Attempting to close ws connection normally");
      this.wsConnection.close();

      this.wsConnection = null;
    }

    this.dolphinConnection.disconnect();

    // Clear incoming events
    this.incomingEvents = [];
  }

  _handleGameData() {
    if (!this.broadcastId || !this.wsConnection) {
      return;
    }

    while (!_.isEmpty(this.incomingEvents)) {
      const event = this.incomingEvents.shift();

      switch (event.type) {
      // Only forward these message types to the server
      case "start_game":
      case "game_event":
      case "end_game":
        const payload = event.payload || "";
        const payloadStart = payload.substring(0, 4);
        const buf = Buffer.from(payloadStart, 'base64');
        const command = buf[0];
        // if (command) {
        //   console.log(`[Broadcast] Sending 0x${command.toString(16)}`);
        // } else {
        //   console.log(`[Broadcast] Empty event received? ${JSON.stringify(event)}`);
        // }
  
        const message = {
          type: 'send-event',
          broadcastId: this.broadcastId,
          event: event,
        };
  
        this.wsConnection.sendUTF(JSON.stringify(message), err => {
          if (err) {
            log.error("[Broadcast] WS send error encountered\n", err);
            this.deadletterEvents.push(event);
            return;
          }
          
          // TODO: Need to somehow preserve events that don't get properly processed for if we need
          // TODO: to reconnect
          // console.log("Received ws send resp");
  
          if (event.type === "game_event") {
            this._debouncedGameDataLog(event.cursor, command);
          }
        });
        break;
      default:
        break;
      }
    }
  }
}

/* eslint-enable no-underscore-dangle */