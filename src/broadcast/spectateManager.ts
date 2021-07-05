import { SlpFileWriter, SlpFileWriterEvent } from "@slippi/slippi-js";
import { app } from "electron";
import log from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import _ from "lodash";
import { client as WebSocketClient, connection, IMessage } from "websocket";

import { dolphinManager, ReplayCommunication } from "../dolphin";
import { ipc_broadcastListUpdatedEvent, ipc_spectateErrorOccurredEvent } from "./ipc";
import { BroadcasterItem } from "./types";

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

const DOLPHIN_INSTANCE_ID = "spectate";

// Store written SLP files to the temp folder by default
const DEFAULT_OUTPUT_PATH = app.getPath("temp");

export enum SpectateManagerEvent {
  ERROR = "error",
  BROADCAST_LIST_UPDATE = "broadcastListUpdate",
}

interface BroadcastInfo {
  broadcastId: string;
  cursor: string | number;
  fileWriter: SlpFileWriter;
  gameStarted: boolean;
  dolphinId: string;
}

const generatePlaybackId = (broadcastId: string) => `spectate-${broadcastId}`;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
export class SpectateManager extends EventEmitter {
  private broadcastInfo: Record<string, BroadcastInfo> = {};
  private wsConnection: connection | null = null;

  public constructor() {
    super();

    // A connection can mirror its received gameplay
    dolphinManager.on("dolphin-closed", (dolphinPlaybackId: string) => {
      const broadcastInfo = Object.values(this.broadcastInfo).find((info) => info.dolphinId === dolphinPlaybackId);
      if (!broadcastInfo) {
        // This is not one of the spectator dolphin instances
        return;
      }

      log.info("[Spectate] Dolphin closed");

      // Stop watching channel
      if (!this.wsConnection) {
        log.error(`[Spectate] Could not close broadcast because connection is gone`);
        return;
      }

      this.stopWatchingBroadcast(broadcastInfo.broadcastId);
    });
  }

  private async _playFile(filePath: string, playbackId: string) {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      replay: filePath,
    };
    return dolphinManager.launchPlaybackDolphin(playbackId, replayComm);
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
          log.info("[Spectate] Game start explicit");
          broadcastInfo.gameStarted = true;
          break;
        }
        case "end_game": {
          // End the current game if it's not already ended
          log.info("[Spectate] Game end explicit");
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
          log.error(`[Spectate] Event type ${event.type} not supported`);
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

      socket.on("connectFailed", (error) => {
        log.error(`[Spectate] WS connection failed\n`, error);
        this.emit(SpectateManagerEvent.ERROR, error);
        reject();
      });

      socket.on("connect", (connection) => {
        log.info("[Spectate] WS connection successful");
        this.wsConnection = connection;

        connection.on("error", (err) => {
          log.error("[Spectate] Error with WS connection\n", err);
          this.emit(SpectateManagerEvent.ERROR, err);
        });

        connection.on("close", (code, reason) => {
          log.info(`[Spectate] connection close: ${code}, ${reason}`);
          // Clear the socket and disconnect from Dolphin too if we're still connected
          this.wsConnection = null;

          if (code === 1006) {
            // Here we have an abnormal disconnect... try to reconnect?
            this.connect(authToken)
              .then(() => {
                if (!this.wsConnection) {
                  return;
                }

                // Reconnect to all the broadcasts that we were already watching
                Object.entries(this.broadcastInfo).forEach(([broadcastId, info]) => {
                  const watchMsg = {
                    type: "watch-broadcast",
                    broadcastId,
                    startCursor: info.cursor,
                  };
                  log.info(`[Spectate] Picking up broadcast ${broadcastId} starting at: ${info.cursor}`);
                  if (this.wsConnection) {
                    this.wsConnection.sendUTF(JSON.stringify(watchMsg));
                  }
                });
              })
              .catch((err) => {
                log.error(`[Specate] Error while reconnecting to broadcast.\n`, err);
              });
          } else {
            // TODO: Somehow kill dolphin? Or maybe reconnect to a person's broadcast when it
            // TODO: comes back up?
          }
        });

        connection.on("message", (message: IMessage) => {
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
              this.emit(SpectateManagerEvent.BROADCAST_LIST_UPDATE, broadcasts);
              break;
            }
            case "events": {
              this._handleEvents(obj);
              break;
            }
            default: {
              log.warn(`[Spectate] Ws resp type ${obj.type} not supported`);
              break;
            }
          }
        });

        resolve();
      });
      if (SLIPPI_WS_SERVER) {
        log.info("[Spectate] Connecting to spectate server");
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
   * @param {string} [targetPath] Where the SLP files should be stored
   * @param {true} [singleton] If true, it will open the broadcasts only
   * in a single Dolphin window. Opens each broadcast in their own window otherwise.
   */
  public watchBroadcast(broadcastId: string, targetPath?: string, singleton?: true) {
    if (!this.wsConnection) {
      throw new Error("No websocket connection");
    }

    const existingBroadcasts = Object.keys(this.broadcastInfo);
    if (existingBroadcasts.includes(broadcastId)) {
      // We're already watching this broadcast!
      log.warn(`[Spectate] We are already watching the selected broadcast`);
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

    const slpFileWriter = new SlpFileWriter({
      folderPath: DEFAULT_OUTPUT_PATH,
    });

    slpFileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      this._playFile(currFilePath, dolphinPlaybackId).catch(log.warn);
    });

    if (targetPath) {
      fs.ensureDirSync(targetPath);
      // Set the path
      slpFileWriter.updateSettings({
        folderPath: targetPath,
      });
    }

    this.broadcastInfo[broadcastId] = {
      broadcastId,
      cursor: -1,
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
    this._playFile("", dolphinPlaybackId).catch(log.warn);
  }
}

export const spectateManager = new SpectateManager();

// Forward the events to the renderer
spectateManager.on(SpectateManagerEvent.BROADCAST_LIST_UPDATE, async (data: BroadcasterItem[]) => {
  await ipc_broadcastListUpdatedEvent.main!.trigger({ items: data });
});

spectateManager.on(SpectateManagerEvent.ERROR, async (error) => {
  await ipc_spectateErrorOccurredEvent.main!.trigger({ errorMessage: error.message ?? JSON.stringify(error) });
});
