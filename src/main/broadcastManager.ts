import { ConnectionEvent, ConnectionStatus, DolphinConnection, DolphinMessageType, Ports } from "@slippi/slippi-js";
import { BroadcastEvent } from "common/types";
import { ipcMain as ipc } from "electron-better-ipc";
import log from "electron-log";
import { EventEmitter } from "events";
import _ from "lodash";
// import { MessageEvent } from "ws";
import { client as WebSocketClient, connection, IMessage } from "websocket";

import { SlippiBroadcastEvent } from "./types";

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

// This variable defines the number of events saved in the case of a disconnect. 1800 should
// support disconnects of 30 seconds at most
const BACKUP_MAX_LENGTH = 1800;

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
export class BroadcastManager extends EventEmitter {
  private broadcastId: string | null;
  private isBroadcastReady: boolean;
  private incomingEvents: SlippiBroadcastEvent[];
  private backupEvents: SlippiBroadcastEvent[];
  private nextGameCursor: number | null;

  private wsConnection: connection | null;
  private dolphinConnection: DolphinConnection;

  constructor() {
    super();
    this.broadcastId = null;
    this.isBroadcastReady = false;
    this.wsConnection = null;
    this.incomingEvents = [];

    // We need to store events as we process them in the event that we get a disconnect and
    // we need to re-send some events to the server
    this.backupEvents = [];

    this.nextGameCursor = null;

    this.dolphinConnection = new DolphinConnection();
    this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, (status: number) => {
      log.info(`[Broadcast] Dolphin status change: ${status}`);
      this.emit(BroadcastEvent.dolphinStatusChange, status);

      // Disconnect from Slippi server when we disconnect from Dolphin
      if (status === ConnectionStatus.DISCONNECTED) {
        // Kind of jank but this will hopefully stop the game on the spectator side when someone
        // kills Dolphin. May no longer be necessary after Dolphin itself sends these messages
        if (this.nextGameCursor !== null) {
          this.incomingEvents.push({
            type: DolphinMessageType.END_GAME,
            cursor: this.nextGameCursor,
            nextCursor: this.nextGameCursor,
            payload: "",
          });
        }

        this._handleGameData();
        this.stop();

        this.incomingEvents = [];
        this.backupEvents = [];
      }
    });
    this.dolphinConnection.on(ConnectionEvent.MESSAGE, (message) => {
      this.incomingEvents.push(message);
      this._handleGameData();
    });
    this.dolphinConnection.on(ConnectionEvent.ERROR, (err) => {
      // Log the error messages we get from Dolphin
      log.error("[Broadcast] Dolphin connection error\n", err);
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  public async start(target: string, token: string) {
    if (this.wsConnection) {
      // We're already connected
      log.info("[Broadcast] we are already connected");
      return;
    }

    // Indicate we're connecting to the Slippi server
    this.emit(BroadcastEvent.slippiStatusChange, ConnectionStatus.CONNECTING);

    const headers = {
      target: target,
      "api-version": 2,
      authorization: `Bearer ${token}`,
    };

    if (SLIPPI_WS_SERVER) {
      const socket = new WebSocketClient({ disableNagleAlgorithm: true } as any);

      socket.on("connectFailed", (error: Error) => {
        log.error("[Broadcast] WS failed to connect\n", error);

        const label = "x-websocket-reject-reason: ";
        let message = error.message;
        const pos = error.message.indexOf(label);
        if (pos >= 0) {
          const endPos = error.message.indexOf("\n", pos + label.length);
          message = message.substring(pos + label.length, endPos >= 0 ? endPos : undefined);
        }

        this.emit(BroadcastEvent.slippiStatusChange, ConnectionStatus.DISCONNECTED);
        this.emit(BroadcastEvent.error, message);
      });

      socket.on("connect", (connection: connection) => {
        log.info("[Broadcast] WS connection successful");
        this.wsConnection = connection;

        const getBroadcasts = async () => {
          if (!this.wsConnection) {
            log.info("[Broadcast] WS connection failed");
            return;
          }
          this.wsConnection.send(
            JSON.stringify({
              type: "get-broadcasts",
            }),
          );
        };

        const startBroadcast = async (broadcastId: string) => {
          if (!this.wsConnection) {
            log.info("[Broadcast] WS connection failed");
            return;
          }
          this.wsConnection.send(
            JSON.stringify({
              type: "start-broadcast",
              name: "Netplay",
              broadcastId: broadcastId,
            }),
          );
        };

        const connectionComplete = (broadcastId: string) => {
          log.info(`[Broadcast] Starting broadcast to: ${broadcastId}`);

          // Clear backup events when a connection completes. The backup events should already have
          // been added back to the events to process at this point if that is relevant
          this.backupEvents = [];
          this.isBroadcastReady = true;

          this.broadcastId = broadcastId;
          this.emit(BroadcastEvent.slippiStatusChange, ConnectionStatus.CONNECTED);

          // Process any events that may have been missed when we disconnected
          this._handleGameData();
        };

        if (this.dolphinConnection.getStatus() === ConnectionStatus.DISCONNECTED) {
          // Now try connect to our local Dolphin instance
          this.dolphinConnection.connect("127.0.0.1", Ports.DEFAULT);
        }

        connection.on("error", (err: Error) => {
          log.error("[Broadcast] WS connection error encountered\n", err);
          this.emit(BroadcastEvent.error, err.message);
        });

        connection.on("close", (code: number, reason: string) => {
          log.info(`[Broadcast] WS connection closed: ${code}, ${reason}`);
          this.emit(BroadcastEvent.slippiStatusChange, ConnectionStatus.DISCONNECTED);

          // Clear the socket and disconnect from Dolphin too if we're still connected
          this.wsConnection = null;
          this.isBroadcastReady = false;

          if (code === 1006) {
            // Here we have an abnormal disconnect... try to reconnect?
            this.start(target, token);
          } else {
            // If normal close, disconnect from dolphin
            this.dolphinConnection.disconnect();
          }
        });

        connection.on("message", (data: IMessage) => {
          if (data.type !== "utf8") {
            return;
          }

          let message: {
            type: string;
            broadcasts?: any[]; // todo: figure out what the heck this is (i think it might just be the broadcastIds)
            broadcastId?: string;
            recoveryGameCursor?: number; // probably, I haven't tested this yet
          };

          try {
            if (data.utf8Data) {
              message = JSON.parse(data.utf8Data);
            } else {
              return;
            }
          } catch (err) {
            log.error(`[Broadcast] Failed to parse message from server\n`, err, data.utf8Data);
            return;
          }

          log.info(message);

          switch (message.type) {
            case "start-broadcast-resp": {
              if (message.recoveryGameCursor !== undefined) {
                const firstIncoming = _.first(this.incomingEvents);
                let firstCursor: number | null | undefined;
                if (firstIncoming) {
                  firstCursor = firstIncoming.cursor;
                }

                log.info(
                  `[Broadcast] Picking broadcast back up from ${message.recoveryGameCursor}. Last not sent: ${firstCursor}`,
                );

                // Add any events that didn't make it to the server to the front of the event queue
                const backedEventsToUse = this.backupEvents.filter((event) => {
                  if (event.cursor !== null && event.cursor !== undefined && message.recoveryGameCursor !== undefined) {
                    const isNeededByServer = event.cursor > message.recoveryGameCursor;

                    // Make sure we aren't duplicating anything that is already in the incoming events array
                    const isNotIncoming = _.isNil(firstCursor) || event.cursor < firstCursor;

                    return isNeededByServer && isNotIncoming;
                  }
                  return false;
                });

                this.incomingEvents = _.concat(backedEventsToUse, this.incomingEvents);

                const newFirstEvent = _.first(this.incomingEvents);
                if (!newFirstEvent) {
                  log.info("[Broadcast] UH I DUNNO SOMEONE COMMENT THIS CORRECTLY");
                  return;
                }
                const newFirstCursor = newFirstEvent.cursor;

                const firstBackupCursor = (_.first(this.backupEvents) || {}).cursor;
                const lastBackupCursor = (_.last(this.backupEvents) || {}).cursor;

                log.info(
                  `[Broadcast] Backup events include range from: [${firstBackupCursor}, ${lastBackupCursor}]. Next cursor to be sent: ${newFirstCursor}`,
                );
              }
              if (message.broadcastId !== undefined) {
                connectionComplete(message.broadcastId);
              }
              break;
            }
            case "get-broadcasts-resp": {
              const broadcasts = message.broadcasts || [];

              // Grab broadcastId we were currently using if the broadcast still exists, would happen
              // in the case of a reconnect
              if (this.broadcastId) {
                const broadcastsById = _.keyBy(broadcasts, "id");
                const prevBroadcast = broadcastsById[this.broadcastId];

                if (prevBroadcast) {
                  startBroadcast(prevBroadcast.id);
                  return;
                }
              }
              startBroadcast(target);
              break;
            }

            default: {
              log.error(`[Broadcast] Ws resp type ${message.type} not supported`);
              break;
            }
          }
        });

        getBroadcasts();
      });

      log.info("[Broadcast] Connecting to WS service");
      socket.connect(SLIPPI_WS_SERVER, "broadcast-protocol", undefined, headers);
    }
  }

  public stop() {
    // TODO: Handle cancelling the retry case

    log.info("[Broadcast] Service stop message received");

    if (this.dolphinConnection.getStatus() === ConnectionStatus.CONNECTED) {
      log.info("[Broadcast] Disconnecting dolphin connection...");

      this.dolphinConnection.disconnect();

      // If the dolphin connection is still active, disconnecting it will cause the stop function
      // to be called again, so just return on this iteration and the callback will handle the rest
      return;
    }

    if (this.wsConnection && this.broadcastId) {
      log.info("[Broadcast] Disconnecting ws connection...");

      this.wsConnection.send(
        JSON.stringify({
          type: "stop-broadcast",
          broadcastId: this.broadcastId,
        }),
      );

      this.wsConnection.close();
      this.wsConnection = null;
    }

    // Clear incoming events
    this.incomingEvents = [];
  }

  private _handleGameData() {
    // On a disconnect, we need to wait until isBroadcastReady otherwise we will skip the messages
    // that were missed because we will start sending new data immediately as soon as the ws
    // is established. We need to wait until the service tells us where we need to pick back up
    // at before starting to send messages again
    if (!this.broadcastId || !this.wsConnection || !this.isBroadcastReady) {
      return;
    }

    while (!_.isEmpty(this.incomingEvents)) {
      const event = this.incomingEvents.shift();
      if (!event) {
        log.error("No incoming events");
        return;
      }
      this.backupEvents.push(event);
      if (this.backupEvents.length > BACKUP_MAX_LENGTH) {
        // Remove element after adding one once size is too big
        this.backupEvents.shift();
      }

      if (event) {
        const message = {
          type: "send-event",
          broadcastId: this.broadcastId,
          event: event,
        };

        switch (event.type) {
          // Only forward these message types to the server
          case "start_game":
          case "game_event":
          case "end_game":
            // const payload = event.payload || "";
            // const payloadStart = payload.substring(0, 4);
            // const buf = Buffer.from(payloadStart, 'base64');
            // const command = buf[0];

            if (event.type === "game_event" && !event.payload) {
              // Don't send empty payload game_event
              break;
            }

            if (event["next_cursor"]) {
              this.nextGameCursor = event["next_cursor"];
            }

            this.wsConnection.send(JSON.stringify(message), (err) => {
              if (err) {
                log.error("[Broadcast] WS send error encountered\n", err);
                // return;
              }
            });
            break;
          default:
            break;
        }
      }
    }
  }
}

export const broadcastManager = new BroadcastManager();

// Add event handlers to notify renderer
broadcastManager.on(BroadcastEvent.error, (error) => {
  ipc.sendToRenderers(BroadcastEvent.error, { error });
});
broadcastManager.on(BroadcastEvent.slippiStatusChange, (status) => {
  ipc.sendToRenderers(BroadcastEvent.slippiStatusChange, { status });
});
broadcastManager.on(BroadcastEvent.dolphinStatusChange, (status) => {
  ipc.sendToRenderers(BroadcastEvent.dolphinStatusChange, { status });
});
