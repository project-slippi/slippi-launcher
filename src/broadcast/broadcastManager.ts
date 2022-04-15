import { ConnectionEvent, ConnectionStatus, DolphinConnection, DolphinMessageType } from "@slippi/slippi-js";
import { EventEmitter } from "events";
import _ from "lodash";
import type { connection, Message } from "websocket";
import { client as WebSocketClient } from "websocket";

import type { SlippiBroadcastPayloadEvent, StartBroadcastConfig } from "./types";
import { BroadcastEvent } from "./types";

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
  private incomingEvents: SlippiBroadcastPayloadEvent[];
  private backupEvents: SlippiBroadcastPayloadEvent[];
  private nextGameCursor: number | null;
  private slippiStatus: ConnectionStatus;

  private wsConnection: connection | null;
  private dolphinConnection: DolphinConnection;

  constructor() {
    super();
    this.broadcastId = null;
    this.isBroadcastReady = false;
    this.wsConnection = null;
    this.incomingEvents = [];
    this.slippiStatus = ConnectionStatus.DISCONNECTED;

    // We need to store events as we process them in the event that we get a disconnect and
    // we need to re-send some events to the server
    this.backupEvents = [];

    this.nextGameCursor = null;

    this.dolphinConnection = new DolphinConnection();
    this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, (status: number) => {
      this.emit(BroadcastEvent.LOG, `Dolphin status change: ${status}`);
      this.emit(BroadcastEvent.DOLPHIN_STATUS_CHANGE, status);

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
      if (err) {
        this.emit(BroadcastEvent.ERROR, err);
      }
    });
  }

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  public async start(config: StartBroadcastConfig) {
    // First try to connect to Dolphin if we haven't already
    if (this.dolphinConnection.getStatus() === ConnectionStatus.DISCONNECTED) {
      try {
        await this._connectToDolphin(config.ip, config.port);
      } catch (err: any) {
        const errMsg = err.message || JSON.stringify(err);
        this.emit(BroadcastEvent.LOG, `Could not connect to Dolphin\n${errMsg}`);
        this.emit(BroadcastEvent.LOG, errMsg);
        this.dolphinConnection.disconnect();
        throw err;
      }
    }

    if (this.wsConnection) {
      // We're already connected
      this.emit(BroadcastEvent.LOG, "we are already connected");
      return;
    }

    // Indicate we're connecting to the Slippi server
    this._setSlippiStatus(ConnectionStatus.CONNECTING);

    const headers = {
      target: config.viewerId,
      "api-version": 2,
      authorization: `Bearer ${config.authToken}`,
    };

    if (!SLIPPI_WS_SERVER) {
      throw new Error("Slippi websocket server is undefined");
    }

    const socket = new WebSocketClient({ disableNagleAlgorithm: true });

    socket.on("connectFailed", (err) => {
      this.emit(BroadcastEvent.LOG, `WS failed to connect`);

      const label = "x-websocket-reject-reason: ";
      let message = err.message;
      const pos = err.message.indexOf(label);
      if (pos >= 0) {
        const endPos = err.message.indexOf("\n", pos + label.length);
        message = message.substring(pos + label.length, endPos >= 0 ? endPos : undefined);
      }

      this.emit(BroadcastEvent.ERROR, message);
      this.stop();
    });

    socket.on("connect", (connection: connection) => {
      this.emit(BroadcastEvent.LOG, "WS connection successful");
      this.wsConnection = connection;

      const getBroadcasts = async () => {
        if (!this.wsConnection) {
          this.emit(BroadcastEvent.LOG, "WS connection failed");
          return;
        }
        this.wsConnection.send(
          JSON.stringify({
            type: "get-broadcasts",
          }),
        );
      };

      const startBroadcast = async (broadcastId: string | null, name?: string) => {
        if (!this.wsConnection) {
          this.emit(BroadcastEvent.LOG, "WS connection failed");
          return;
        }
        this.wsConnection.send(
          JSON.stringify({
            type: "start-broadcast",
            name: name ?? "Netplay",
            broadcastId,
          }),
        );
      };

      const connectionComplete = (broadcastId: string) => {
        this.emit(BroadcastEvent.LOG, `Starting broadcast to: ${broadcastId}`);

        // Clear backup events when a connection completes. The backup events should already have
        // been added back to the events to process at this point if that is relevant
        this.backupEvents = [];
        this.isBroadcastReady = true;

        this.broadcastId = broadcastId;
        this._setSlippiStatus(ConnectionStatus.CONNECTED);

        // Process any events that may have been missed when we disconnected
        this._handleGameData();
      };

      connection.on("error", (err) => {
        this.emit(BroadcastEvent.ERROR, err);
      });

      connection.on("close", (code: number, reason: string) => {
        this.emit(BroadcastEvent.LOG, `WS connection closed: ${code}, ${reason}`);

        // Clear the socket
        this.wsConnection = null;
        this.isBroadcastReady = false;

        if (code === 1006) {
          // Here we have an abnormal disconnect... try to reconnect?
          // This error seems to occur primarily when the auth token for firebase expires,
          // which lasts 1 hour, so the plan is to get a new token, use the same config, and reconnect.
          this._setSlippiStatus(ConnectionStatus.RECONNECT_WAIT);
          this.emit(BroadcastEvent.RECONNECT, config);
        } else {
          // If normal close, disconnect from dolphin
          this.dolphinConnection.disconnect();
          this._setSlippiStatus(ConnectionStatus.DISCONNECTED);
        }
      });

      connection.on("message", (data: Message) => {
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
        } catch (err: any) {
          const errMsg = err.message || JSON.stringify(err);
          this.emit(BroadcastEvent.LOG, `Failed to parse message from server\n${errMsg}\n${data.utf8Data}`);
          return;
        }

        this.emit(BroadcastEvent.LOG, message);

        switch (message.type) {
          case "start-broadcast-resp": {
            if (message.recoveryGameCursor !== undefined) {
              const firstIncoming = _.first(this.incomingEvents);
              let firstCursor: number | null | undefined;
              if (firstIncoming) {
                firstCursor = firstIncoming.cursor;
              }

              this.emit(
                BroadcastEvent.LOG,
                `Picking broadcast back up from ${message.recoveryGameCursor}. Last not sent: ${firstCursor}`,
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
                this.emit(BroadcastEvent.LOG, "Missing new first event");
                return;
              }
              const newFirstCursor = newFirstEvent.cursor;

              const firstBackupCursor = (_.first(this.backupEvents) || {}).cursor;
              const lastBackupCursor = (_.last(this.backupEvents) || {}).cursor;

              this.emit(
                BroadcastEvent.LOG,
                `Backup events include range from: [${firstBackupCursor}, ${lastBackupCursor}]. Next cursor to be sent: ${newFirstCursor}`,
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
                // TODO: Figure out if this config.name guaranteed to be the correct name?
                startBroadcast(prevBroadcast.id, config.name).catch(console.warn);
                return;
              }
            }

            // Pass in null as the broadcast ID to tell the server to generate an ID for us
            startBroadcast(null, config.name).catch(console.warn);
            break;
          }

          default: {
            this.emit(BroadcastEvent.LOG, `Ws resp type ${message.type} not supported`);
            break;
          }
        }
      });

      getBroadcasts().catch(console.warn);
    });

    this.emit(BroadcastEvent.LOG, "Connecting to WS service");
    socket.connect(SLIPPI_WS_SERVER, "broadcast-protocol", undefined, headers);
  }

  public stop() {
    // TODO: Handle cancelling the retry case

    this.emit(BroadcastEvent.LOG, "Service stop message received");

    if (this.dolphinConnection.getStatus() === ConnectionStatus.CONNECTED) {
      this.emit(BroadcastEvent.LOG, "Disconnecting dolphin connection...");

      this.dolphinConnection.disconnect();

      // If the dolphin connection is still active, disconnecting it will cause the stop function
      // to be called again, so just return on this iteration and the callback will handle the rest
      return;
    }

    if (this.wsConnection && this.broadcastId) {
      this.emit(BroadcastEvent.LOG, "Disconnecting ws connection...");

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

  /**
   * Initiates a connection to Dolphin but only resolves when it's actually connected.
   * The promise rejects if not connected before the timeout.
   */
  private async _connectToDolphin(ip: string, port: number, timeout = 5000): Promise<void> {
    // We're already connected so do nothing
    if (this.dolphinConnection.getStatus() === ConnectionStatus.CONNECTED) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Set up the timeout
      const timer = setTimeout(() => {
        reject(new Error(`Dolphin connection request timed out after ${timeout}ms`));
      }, timeout);

      const connectionChangeHandler = (status: number) => {
        switch (status) {
          case ConnectionStatus.CONNECTED: {
            // Stop listening to the event
            this.dolphinConnection.removeListener(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);

            clearTimeout(timer);
            resolve();
            return;
          }
          case ConnectionStatus.DISCONNECTED: {
            // Stop listening to the event
            this.dolphinConnection.removeListener(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);

            clearTimeout(timer);
            reject(new Error("Broadcast manager failed to connect to Dolphin"));
            return;
          }
        }
      };

      // Set up the listeners
      this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);

      // Actually initiate the connection
      this.dolphinConnection.connect(ip, port).catch(reject);
    });
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
        this.emit(BroadcastEvent.LOG, "No incoming events");
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

            if (event.nextCursor) {
              this.nextGameCursor = event.nextCursor;
            }

            this.wsConnection.send(JSON.stringify(message), (err) => {
              if (err) {
                this.emit(BroadcastEvent.ERROR, err);
              }
            });
            break;
          default:
            break;
        }
      }
    }
  }

  private _setSlippiStatus(status: ConnectionStatus) {
    if (this.slippiStatus === ConnectionStatus.RECONNECT_WAIT && status === ConnectionStatus.CONNECTING) {
      return;
    }
    this.slippiStatus = status;
    this.emit(BroadcastEvent.SLIPPI_STATUS_CHANGE, status);
  }
}
