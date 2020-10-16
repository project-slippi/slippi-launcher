/* eslint-disable no-underscore-dangle */

import log from 'electron-log';
import { client as WebSocketClient } from 'websocket';
import * as firebase from 'firebase';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';

import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';
import { store } from '../index';
import { updateViewableBroadcasts } from '../actions/broadcast';
import { displayError } from '../actions/error';

const { app } = require('electron').remote;

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
// eslint-disable-next-line import/prefer-default-export
export class SpectateManager {
  constructor() {
    this.prevBroadcastId = null;
    this.wsConnection = null;
    this.broadcasts = [];
    this.gameStarted = false;

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`spectate`, { mode: 'mirror' });
    this.dolphinManager.on('dolphin-closed', () => {
      log.info("[Spectator] dolphin closed");

      // Stop watching channel
      if (this.prevBroadcastId) {
        this.wsConnection.sendUTF(JSON.stringify({
          type: "close-broadcast",
          broadcastId: this.prevBroadcastId,
        }));
      }

      // Reset the game started flag
      this.gameStarted = false;
      // Clear previous broadcast ID when Dolphin closes
      this.prevBroadcastId = null;
    });

    // Get path for spectate replays in my documents
    const documentsPath = app.getPath("documents");
    const targetPath = path.join(documentsPath, 'Slippi', 'Spectate');
    fs.ensureDirSync(targetPath);

    // Initialize SlpFileWriter for writting files
    const slpSettings = {
      folderPath: targetPath,
      onFileStateChange: () => { },
    };
    this.slpFileWriter = new SlpFileWriter(slpSettings);
    this.slpFileWriter.on("new-file", (curFilePath) => {
      this.dolphinManager.playFile(curFilePath, false);
    });

    this.debouncedGameDataLog = _.debounce((cursor, cmd) => {
      // I can't figure out how to differentiate when an invocation is triggered by a leading vs
      // falling edge, would be useful to log that
      log.info(`[Spectate] Game events edge. ${cursor} 0x${cmd ? cmd.toString(16) : "??"}`);
    }, 1000, {
      leading: true,
      trailing: true,
    });
  }

  handleEvents(obj) {
    const events = obj.events || [];

    events.forEach(event => {
      switch (event.type) {
      case 'start_game':
        this.gameStarted = true;
        break;
      case 'end_game':
        // End the current game if it's not already ended
        this.slpFileWriter.endGame();
        this.gameStarted = false;
        break;
      case 'game_event':
        const payloadStart = event.payload.substring(0, 4);
        const payloadStartBuf = Buffer.from(payloadStart, 'base64');
        const command = payloadStartBuf[0];

        this.debouncedGameDataLog(event.cursor, command);

        if (command === 0x35) {
          this.gameStarted = true;
          // console.log("[Spectate] Game start");
        }

        // Only forward data to the file writer when it's an active game
        if (this.gameStarted) {
          // if (command) {
          //   console.log(`[Spectate] Handling 0x${command.toString(16)}`);
          // } else {
          //   console.log(`[Spectate] Empty message received? ${JSON.stringify(obj)}`);
          // }

          const buf = Buffer.from(event.payload, 'base64');
          this.slpFileWriter.handleData(buf);
        }

        if (command === 0x39) {
          // End the current game if it's not already ended
          this.slpFileWriter.endGame();
          this.gameStarted = false;
          // console.log("[Spectate] Game end");
        }

        break;
      default:
        log.error(`[Spectate] Event type ${event.type} not supported`);
        break;
      }
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  async connect(password) {
    if (this.wsConnection) {
      // We're already connected
      console.log("Skipping websocket connection since we're already connected");
      return;
    }

    const headers = {
      password: password,
    };
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.authorization = `Bearer ${token}`;
    }

    await new Promise((resolve, reject) => {
      const socket = new WebSocketClient();

      socket.on('connectFailed', (error) => {
        log.error(`[Spectate] WS connection failed\n`, error);
        const errorAction = displayError(
          'broadcast-global',
          error.message,
        );
        store.dispatch(errorAction);

        reject();
      });

      socket.on('connect', (connection) => {
        log.info("[Spectate] WS connection successful");
        this.wsConnection = connection;

        connection.on('error', (err) => {
          log.error("[Spectate] Error with WS connection\n", err);
          const errorAction = displayError(
            'broadcast-global',
            err.message,
          );
          store.dispatch(errorAction);
        });

        connection.on('close', (code, reason) => {
          log.info(`[Spectate] connection close: ${code}, ${reason}`);
          // Clear the socket and disconnect from Dolphin too if we're still connected
          this.wsConnection = null;

          // TODO: Somehow kill dolphin? Or maybe reconnect to a person's broadcast when it
          // TODO: comes back up?
        });

        connection.on('message', message => {
          if (message.type !== "utf8") {
            return;
          }

          // console.log(`[Spectator] ${message.utf8Data}`);
          const obj = JSON.parse(message.utf8Data);
          switch (obj.type) {
          case 'list-broadcasts-resp':
            this.broadcasts = obj.broadcasts || [];
            store.dispatch(updateViewableBroadcasts(this.broadcasts));
            break;
          case 'events':
            this.handleEvents(obj);
            break;
          default:
            log.error(`[Spectate] Ws resp type ${obj.type} not supported`);
            break;
          }
        });

        resolve();
      });

      socket.connect(SLIPPI_WS_SERVER, 'spectate-protocol', undefined, headers);
    });
  }

  refreshBroadcasts() {
    if (!this.wsConnection) {
      return;
    }

    this.wsConnection.sendUTF(JSON.stringify({
      type: "list-broadcasts",
    }));
  }

  watchBroadcast(broadcastId) {
    if (!this.wsConnection) {
      return;
    }

    if (broadcastId === this.prevBroadcastId) {
      // If we have not changed broadcasts, don't do anything. Worth noting that closing
      // dolphin will count as a broadcast change because it resets prevBroadcastId
      return;
    }

    if (this.prevBroadcastId) {
      this.wsConnection.sendUTF(JSON.stringify({
        type: "close-broadcast",
        broadcastId: this.prevBroadcastId,
      }));
    }

    this.wsConnection.sendUTF(JSON.stringify({
      type: "watch-broadcast",
      broadcastId: broadcastId,
    }));

    // Play an empty file such that we just launch into the waiting for game screen, this is
    // used to clear out any previous file that we were reading for. The file will get updated
    // by the fileWriter
    this.dolphinManager.playFile("", true);

    this.prevBroadcastId = broadcastId;
  }
}

/* eslint-enable no-underscore-dangle */