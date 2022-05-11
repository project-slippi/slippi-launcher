import { SlpFileWriter, SlpFileWriterEvent } from "@slippi/slippi-js";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import _ from "lodash";
import type { connection, Message } from "websocket";
import { client as WebSocketClient } from "websocket";

import type { BroadcasterItem } from "./types";
import { SpectateEvent } from "./types";

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

const DOLPHIN_INSTANCE_ID = "spectate";

interface BroadcastInfo {
  broadcastId: string;
  cursor: string;
  fileWriter: SlpFileWriter;
  gameStarted: boolean;
  dolphinId: string;
}

const generatePlaybackId = (broadcastId: string) => `spectate-${broadcastId}`;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 * TODO: Have SpectateManager only care about reading the data stream and writing it to a file.
 * Dealing with dolphin related details should be handled elsewhere.
 */
export class SpectateManager extends EventEmitter {
  private broadcastInfo: Record<string, BroadcastInfo> = {};
  private wsConnection: connection | null = null;

  constructor() {
    super();
  }

  private async _playFile(filePath: string, playbackId: string) {
    this.emit(SpectateEvent.NEW_FILE, playbackId, filePath);
  }

  private _handleEvents(obj: { type: string; broadcastId: string; cursor: string; events: any[] }) {
    const events = obj.events ?? [];
    const broadcastId: string = obj.broadcastId;

    const broadcastInfo = this.broadcastInfo[broadcastId];
    if (!broadcastInfo) {
      // We've stopped watching this broadcast already
      return;
    }

    // Update cursor with redis cursor such that if we disconnect, we can pick back up from where
    // we left off
    broadcastInfo.cursor = obj.cursor;

    events.forEach((event: any) => {
      switch (event.type) {
        case "start_game": {
          this.emit(SpectateEvent.LOG, "Game start explicit");
          broadcastInfo.gameStarted = true;
          break;
        }
        case "end_game": {
          // End the current game if it's not already ended
          this.emit(SpectateEvent.LOG, "Game end explicit");
          broadcastInfo.fileWriter.endCurrentFile();
          broadcastInfo.gameStarted = false;
          break;
        }
        case "game_event": {
          // Only forward data to the file writer when it's an active game
          if (broadcastInfo.gameStarted) {
            const buf = Buffer.from(event.payload, "base64");
            broadcastInfo.fileWriter.write(buf);
          }

          break;
        }
        default:
          this.emit(SpectateEvent.LOG, `Event type ${event.type} not supported`);
          break;
      }
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  public async connect(authToken: string) {
    if (this.wsConnection) {
      return;
    }

    const headers = {
      "api-version": 2,
      authorization: `Bearer ${authToken}`,
    };

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocketClient();

      socket.on("connectFailed", (err) => {
        this.emit(SpectateEvent.ERROR, err);
        reject();
      });

      socket.on("connect", (connection) => {
        this.emit(SpectateEvent.LOG, "WS connection successful");
        this.wsConnection = connection;

        // Reconnect to all the broadcasts that we were already watching
        Object.entries(this.broadcastInfo).forEach(([broadcastId, info]) => {
          const watchMsg: { type: string; broadcastId: string; startCursor?: string } = {
            type: "watch-broadcast",
            broadcastId,
          };
          if (info.cursor !== "") {
            watchMsg.startCursor = info.cursor;
          }
          if (this.wsConnection) {
            this.emit(SpectateEvent.LOG, `Picking up broadcast ${broadcastId} starting at: ${info.cursor}`);
            this.wsConnection.sendUTF(JSON.stringify(watchMsg));
          }
        });

        connection.on("error", (err) => {
          this.emit(SpectateEvent.ERROR, err);
        });

        connection.on("close", (code, reason) => {
          this.emit(SpectateEvent.LOG, `connection close: ${code}, ${reason}`);
          // Clear the socket and disconnect from Dolphin too if we're still connected
          this.wsConnection = null;

          if (code === 1006) {
            // Here we have an abnormal disconnect... try to reconnect?
            // This error seems to occur primarily when the auth token for firebase expires,
            // which lasts 1 hour, so the plan is to get a new token and reconnect.
            this.emit(SpectateEvent.LOG, "Auth token expired, reconencting...");
            this.emit(SpectateEvent.RECONNECT, authToken);
          } else {
            // TODO: Somehow kill dolphin? Or maybe reconnect to a person's broadcast when it
            // TODO: comes back up?
          }
        });

        connection.on("message", (message: Message) => {
          if (message.type !== "utf8") {
            return;
          }

          let obj;
          if (message.utf8Data) {
            obj = JSON.parse(message.utf8Data);
          }
          switch (obj.type) {
            case "list-broadcasts-resp": {
              const broadcasts: BroadcasterItem[] = obj.broadcasts ?? [];
              this.emit(SpectateEvent.BROADCAST_LIST_UPDATE, broadcasts);
              break;
            }
            case "events": {
              this._handleEvents(obj);
              break;
            }
            default: {
              this.emit(SpectateEvent.LOG, `Ws resp type ${obj.type} not supported`);
              break;
            }
          }
        });

        resolve();
      });
      if (SLIPPI_WS_SERVER) {
        this.emit(SpectateEvent.LOG, "Connecting to spectate server");
        socket.connect(SLIPPI_WS_SERVER, "spectate-protocol", undefined, headers);
      }
    });
  }

  public async refreshBroadcastList(): Promise<void> {
    if (!this.wsConnection) {
      throw new Error("No websocket connection");
    }

    this.wsConnection.sendUTF(
      JSON.stringify({
        type: "list-broadcasts",
      }),
    );
  }

  public stopWatchingBroadcast(broadcastId: string) {
    if (this.wsConnection) {
      // Send the stop request to the server
      this.wsConnection.sendUTF(
        JSON.stringify({
          type: "close-broadcast",
          broadcastId,
        }),
      );
    }

    // End the file writing and remove from the map
    const info = this.broadcastInfo[broadcastId];
    if (info) {
      info.fileWriter.endCurrentFile();
      delete this.broadcastInfo[broadcastId];
    }
  }

  /**
   * Starts watching a broadcast
   *
   * @param {string} broadcastId The ID of the broadcast to watch
   * @param {string} targetPath Where the SLP files should be stored
   * @param {true} [singleton] If true, it will open the broadcasts only
   * in a single Dolphin window. Opens each broadcast in their own window otherwise.
   */
  public watchBroadcast(broadcastId: string, targetPath: string, singleton?: true) {
    if (!this.wsConnection) {
      throw new Error("No websocket connection");
    }

    const existingBroadcasts = Object.keys(this.broadcastInfo);
    if (existingBroadcasts.includes(broadcastId)) {
      // We're already watching this broadcast!
      this.emit(SpectateEvent.LOG, `We are already watching the selected broadcast`);
      return;
    }

    let dolphinPlaybackId = generatePlaybackId(broadcastId);

    // We're only watching one at at time so stop other broadcasts
    if (singleton) {
      existingBroadcasts.forEach((broadcastInfo) => {
        this.stopWatchingBroadcast(broadcastInfo);
      });

      // Use the default playback ID
      dolphinPlaybackId = DOLPHIN_INSTANCE_ID;
    }

    fs.ensureDirSync(targetPath);
    const slpFileWriter = new SlpFileWriter({
      folderPath: targetPath,
    });

    slpFileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      this._playFile(currFilePath, dolphinPlaybackId).catch(console.warn);
    });

    this.broadcastInfo[broadcastId] = {
      broadcastId,
      cursor: "",
      fileWriter: slpFileWriter,
      gameStarted: false,
      dolphinId: dolphinPlaybackId,
    };

    this.wsConnection.sendUTF(
      JSON.stringify({
        type: "watch-broadcast",
        broadcastId,
      }),
    );

    // Play an empty file such that we just launch into the waiting for game screen, this is
    // used to clear out any previous file that we were reading for. The file will get updated
    // by the fileWriter
    this._playFile("", dolphinPlaybackId).catch(console.warn);
  }

  public handleClosedDolphin(playbackId: string) {
    const broadcastInfo = Object.values(this.broadcastInfo).find((info) => info.dolphinId === playbackId);
    if (!broadcastInfo) {
      // This is not one of the spectator dolphin instances
      return;
    }

    this.emit(SpectateEvent.LOG, "Dolphin closed");

    // Stop watching channel
    if (!this.wsConnection) {
      this.emit(SpectateEvent.LOG, `Could not close broadcast because connection is gone`);
      return;
    }

    this.stopWatchingBroadcast(broadcastInfo.broadcastId);
  }
}
