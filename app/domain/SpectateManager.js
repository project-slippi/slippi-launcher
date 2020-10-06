import log from 'electron-log';
import { client as WebSocketClient } from 'websocket';
import * as firebase from 'firebase';
import fs from 'fs-extra';
import path from 'path';

import DolphinManager from './DolphinManager';
import SlpFileWriter from './SlpFileWriter';
import { store } from '../index';
import { updateBroadcastChannels } from '../actions/broadcast';
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
    this.prevChannelId = null;
    this.wsConnection = null;
    this.channels = [];
    this.gameStarted = false;

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`spectate`, { mode: 'mirror' });
    this.dolphinManager.on('dolphin-closed', () => {
      // Clear previous channel ID when Dolphin closes
      this.prevChannelId = null;
    });

    // Get path for spectate replays in my documents
    const documentsPath = app.getPath("documents");
    const targetPath = path.join(documentsPath, 'Slippi', 'Spectate');
    fs.ensureDirSync(targetPath);
    console.log(targetPath);

    // Initialize SlpFileWriter for writting files
    const slpSettings = {
      folderPath: targetPath,
      onFileStateChange: () => { },
    };
    this.slpFileWriter = new SlpFileWriter(slpSettings);
    this.slpFileWriter.on("new-file", (curFilePath) => {
      this.dolphinManager.playFile(curFilePath, false);
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
        const errorAction = displayError(
          'broadcast-global',
          error.message,
        );
        store.dispatch(errorAction);

        reject();
      });
  
      socket.on('connect', (connection) => {
        this.wsConnection = connection;
  
        connection.on('error', (err) => {
          log.error("[SpectateManager] Error connecting to Slippi server: ", err);
          const errorAction = displayError(
            'broadcast-global',
            err.message,
          );
          store.dispatch(errorAction);
        });
  
        connection.on('close', () => {
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
          case 'list-channels-resp':
            this.channels = obj.channels || [];
            store.dispatch(updateBroadcastChannels(this.channels));
            break;
          case 'start_game':
            this.gameStarted = true;
            break;
          case 'end_game':
            this.gameStarted = false;
            break;
          case 'game_event':
            // Only forward data to the file writer when it's a new game
            if (this.gameStarted) {
              const buf = Buffer.from(obj.payload, 'base64');
              this.slpFileWriter.handleData(buf);
            }
            break;
          default:
            console.log(`Ws resp type ${obj.type} not supported`);
            break;
          }
        });

        resolve();
      });
  
      socket.connect(SLIPPI_WS_SERVER, 'spectate-protocol', undefined, headers);
    });
  }

  refreshChannels() {
    if (!this.wsConnection) {
      return;
    }

    this.wsConnection.sendUTF(JSON.stringify({
      type: "list-channels",
    }));
  }

  watchChannel(channelId) {
    if (!this.wsConnection) {
      return;
    }

    if (channelId === this.prevChannelId) {
      // If we have not changed channels, don't do anything. Worth noting that closing
      // dolphin will count as a channel change because it resets prevChannelId
      return;
    }

    this.wsConnection.sendUTF(JSON.stringify({
      type: "change-channel",
      channelId: channelId,
    }));

    // Play an empty file such that we just launch into the waiting for game screen, this is
    // used to clear out any previous file that we were reading for. The file will get updated
    // by the fileWriter
    this.dolphinManager.playFile("", true);

    this.prevChannelId = channelId;
  }
}