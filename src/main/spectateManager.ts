import log from "electron-log";
import * as fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { client as WebSocketClient, connection, IMessage } from "websocket";

import { DolphinManager } from "./dolphinManager";

// import SlpFileWriter from "./SlpFileWriter"; // TODO: will have to reimplement later

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
export class SpectateManager {
  private prevBroadcastId: string | null;
  private gameStarted: boolean;
  private cursorByBroadcast: any;
  private dolphinManager: DolphinManager;

  private wsConnection: connection | null;
  constructor() {
    this.prevBroadcastId = null;
    this.wsConnection = null;
    this.gameStarted = false;
    this.cursorByBroadcast = {};

    // A connection can mirror its received gameplay
    this.dolphinManager = DolphinManager.getInstance();
    this.dolphinManager.on("dolphin-closed", () => {
      log.info("[Spectator] dolphin closed");

      // Stop watching channel
      if (this.prevBroadcastId) {
        if (this.wsConnection) {
          this.wsConnection.sendUTF(
            JSON.stringify({
              type: "close-broadcast",
              broadcastId: this.prevBroadcastId,
            }),
          );
        } else {
          log.error(`[Spectate] Could not close broadcast because connection is gone`);
        }
      }

      // Reset the game started flag
      this.gameStarted = false;
      // Clear previous broadcast ID when Dolphin closes
      this.prevBroadcastId = null;
    });

    // Initialize SlpFileWriter for writting files with an empty folderPath
    // We will update the folderPath when starting to watch a broadcast
    // const slpSettings = {
    //   folderPath: "",
    //   onFileStateChange: () => {},
    // };
    // this.slpFileWriter = new SlpFileWriter(slpSettings);
    // this.slpFileWriter.on("new-file", (curFilePath) => {
    //   this.dolphinManager.playFile(curFilePath, false);
    // });
  }

  handleEvents(obj: any) {
    const events = obj.events || [];

    events.forEach((event: any) => {
      switch (event.type) {
        case "start_game": {
          this.gameStarted = true;
          break;
        }
        case "end_game": {
          // End the current game if it's not already ended
          // log.info("[Spectate] Game end explicit");
          // this.slpFileWriter.endGame();
          this.gameStarted = false;
          break;
        }
        case "game_event": {
          const payloadStart = event.payload.substring(0, 4);
          const payloadStartBuf = Buffer.from(payloadStart, "base64");
          const command = payloadStartBuf[0];

          if (command === 0x35) {
            this.gameStarted = true;
            // log.info("[Spectate] Game start");
          }

          // Only forward data to the file writer when it's an active game
          if (this.gameStarted) {
            // const buf = Buffer.from(event.payload, "base64");
            // this.slpFileWriter.handleData(buf);
          }

          if (command === 0x39) {
            // End the current game if it's not already ended
            // log.info("[Spectate] Game end 0x39");
            // this.slpFileWriter.endGame();
            this.gameStarted = false;
          }

          break;
        }
        default:
          log.error(`[Spectate] Event type ${event.type} not supported`);
          break;
      }
    });

    // Update cursor with redis cursor such that if we disconnect, we can pick back up from where
    // we left off
    this.cursorByBroadcast[obj.broadcastId] = obj.cursor;
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  async connect() {
    if (this.wsConnection) {
      // We're already connected
      console.log("Skipping websocket connection since we're already connected");
      return;
    }

    const headers = {
      "api-version": 2,
      authorization: `Bearer ${false}`, // TODO: get the actual token
    };

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocketClient();

      socket.on("connectFailed", (error) => {
        log.error(`[Spectate] WS connection failed\n`, error);
        // TODO: Render an error about the websocket connection
        // const errorAction = displayError("broadcast-global", error.message);
        // store.dispatch(errorAction);

        reject();
      });

      socket.on("connect", (connection) => {
        log.info("[Spectate] WS connection successful");
        this.wsConnection = connection;

        connection.on("error", (err) => {
          log.error("[Spectate] Error with WS connection\n", err);
          // TODO: Render an error about the websocket connection
          // const errorAction = displayError("broadcast-global", err.message);
          // store.dispatch(errorAction);
        });

        connection.on("close", (code, reason) => {
          log.info(`[Spectate] connection close: ${code}, ${reason}`);
          // Clear the socket and disconnect from Dolphin too if we're still connected
          this.wsConnection = null;

          if (code === 1006) {
            // Here we have an abnormal disconnect... try to reconnect?
            this.connect()
              .then(() => {
                if (!this.prevBroadcastId || !this.wsConnection) {
                  return;
                }

                const watchMsg = {
                  type: "watch-broadcast",
                  broadcastId: this.prevBroadcastId,
                  startCursor: -1,
                };

                // If we were previously watching a broadcast, let's try to reconnect to it
                const prevCursor = this.cursorByBroadcast[this.prevBroadcastId];
                if (prevCursor) {
                  watchMsg.startCursor = prevCursor;
                }

                log.info(`[Spectate] Picking up broadcast ${this.prevBroadcastId} starting at: ${prevCursor}`);

                this.wsConnection.sendUTF(JSON.stringify(watchMsg));
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

          // console.log(`[Spectator] ${message.utf8Data}`);
          let obj;
          if (message.utf8Data) {
            obj = JSON.parse(message.utf8Data);
          }
          switch (obj.type) {
            case "list-broadcasts-resp":
              // TODO: Tell renderer to show some broadcasts
              // const broadcasts = obj.broadcasts || [];
              // store.dispatch(updateViewableBroadcasts(broadcasts));
              break;
            case "events":
              this.handleEvents(obj);
              break;
            default:
              log.error(`[Spectate] Ws resp type ${obj.type} not supported`);
              break;
          }
        });

        resolve();
      });
      if (SLIPPI_WS_SERVER) {
        socket.connect(SLIPPI_WS_SERVER, "spectate-protocol", undefined, headers);
      }
    });
  }

  refreshBroadcasts() {
    if (!this.wsConnection) {
      return;
    }

    this.wsConnection.sendUTF(
      JSON.stringify({
        type: "list-broadcasts",
      }),
    );
  }

  fetchSpectateFolder() {
    const rootFolderPath = ""; // will need to figure out if we can get the root slp path in the main process
    if (!rootFolderPath) {
      throw new Error(
        `Files cannot be saved without a Root Replay Directory set. Please return to the
        settings page and set a Replay Root Directory.`,
      );
    }
    return path.join(rootFolderPath, "Spectate");
  }

  watchBroadcast(broadcastId: string) {
    if (!this.wsConnection) {
      return;
    }

    // Get path for spectate replays
    const targetPath = this.fetchSpectateFolder();
    fs.ensureDirSync(targetPath);

    // const slpSettings = {
    //   folderPath: targetPath,
    // };

    // this.slpFileWriter.updateSettings(slpSettings);

    if (broadcastId === this.prevBroadcastId) {
      // If we have not changed broadcasts, don't do anything. Worth noting that closing
      // dolphin will count as a broadcast change because it resets prevBroadcastId
      return;
    }

    if (this.prevBroadcastId) {
      this.wsConnection.sendUTF(
        JSON.stringify({
          type: "close-broadcast",
          broadcastId: this.prevBroadcastId,
        }),
      );
    }

    this.wsConnection.sendUTF(
      JSON.stringify({
        type: "watch-broadcast",
        broadcastId: broadcastId,
      }),
    );

    // Play an empty file such that we just launch into the waiting for game screen, this is
    // used to clear out any previous file that we were reading for. The file will get updated
    // by the fileWriter
    // this.dolphinManager.playFile("", true); TODO: figure out how to implement this properly

    this.prevBroadcastId = broadcastId;
  }
}
