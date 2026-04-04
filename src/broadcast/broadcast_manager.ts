import { Preconditions } from "@common/preconditions";
import type { SlpRawEventPayload } from "@slippi/slippi-js/node";
import {
  Command,
  ConnectionEvent,
  ConnectionStatus,
  ConsoleConnection,
  DolphinConnection,
  DolphinMessageType,
  SlpStream,
  SlpStreamEvent,
  SlpStreamMode,
} from "@slippi/slippi-js/node";
import { EventEmitter } from "events";
import keyBy from "lodash/keyBy";
import last from "lodash/last";
import type { connection, Message } from "websocket";
import { client as WebSocketClient } from "websocket";

import type { SlippiBroadcastPayloadEvent, StartBroadcastConfig } from "./types";
import { BroadcastEvent } from "./types";

const SLIPPI_WS_SERVER = process.env.SLIPPI_WS_SERVER;

// This variable defines the number of events saved in the case of a disconnect. 1800 should
// support disconnects of 30 seconds at most
const BACKUP_MAX_LENGTH = 1800;

const CONNECTING_SUB_STEP_INITIAL_TIMEOUT = 2000;
const CONNECTING_SUB_STEP_MAX_TIMEOUT = 30000;

enum ConnectingSubStep {
  NONE = "NONE",
  SOCKET = "SOCKET",
  GET = "GET",
  START = "START",
}

type WsMessage =
  | {
      type: "start-broadcast-resp";
      broadcastId?: string;
      recoveryGameCursor?: number;
    }
  | {
      type: "get-broadcasts-resp";
      broadcasts?: Array<{ id: string; name: string }>;
    };

/**
 * Responsible for retrieving Dolphin game data over enet and sending the data
 * to the Slippi server over websockets.
 */
export class BroadcastManager extends EventEmitter {
  private broadcastId: string | null = null;
  private isBroadcastReady = false;
  private incomingEvents: SlippiBroadcastPayloadEvent[] = [];
  private backupEvents: SlippiBroadcastPayloadEvent[] = [];
  private nextGameCursor: number | null = null;
  private slippiStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  private wsClient: WebSocketClient | null = null;
  private wsConnection: connection | null = null;
  private connection: DolphinConnection | ConsoleConnection | null = null;

  private connectingSubStep: ConnectingSubStep = ConnectingSubStep.NONE;
  private connectingRetryTimeout = CONNECTING_SUB_STEP_INITIAL_TIMEOUT;
  private retryTimer: NodeJS.Timeout | null = null;

  /**
   * Connects to the Slippi server and the local Dolphin instance
   */
  public async start(config: StartBroadcastConfig) {
    Preconditions.checkExists(SLIPPI_WS_SERVER, "Slippi websocket server is undefined");

    // Clean up any existing connection first
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }

    this.connection = config.connectionType === "dolphin" ? new DolphinConnection() : new ConsoleConnection();

    // Connect to Dolphin/Console if not already connected
    if (this.connection.getStatus() === ConnectionStatus.DISCONNECTED) {
      try {
        await this._connectToGameSource(config.ip, config.port);
        this.setupGameSourceListeners();
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        this.emit(BroadcastEvent.LOG, `Could not connect to game source\n${errMsg}`);
        this.connection.disconnect();
        throw err;
      }
    }

    if (this.wsConnection) {
      this.emit(BroadcastEvent.LOG, "WebSocket already connected");
      return;
    }

    // If we have a WS client but no connection, we're mid-connecting. Start over.
    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      this.wsClient.abort();
      this.wsClient = null;
    }

    this._setSlippiStatus(ConnectionStatus.CONNECTING);
    this._resetConnectingState();

    const headers = {
      target: config.viewerId,
      "api-version": 2,
      authorization: `Bearer ${config.authToken}`,
    };

    this.wsClient = new WebSocketClient({ disableNagleAlgorithm: true });
    this._setupWsClientListeners(headers, config);

    this.emit(BroadcastEvent.LOG, "Connecting to WS service");
    this.wsClient.connect(SLIPPI_WS_SERVER, "broadcast-protocol", undefined, headers);
    this.connectingSubStep = ConnectingSubStep.SOCKET;
  }

  public stop() {
    this.emit(BroadcastEvent.LOG, "Service stop message received");

    // Clear retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    // Disconnect from game source
    if (this.connection?.getStatus() === ConnectionStatus.CONNECTED) {
      this.emit(BroadcastEvent.LOG, "Disconnecting game source connection...");
      this.connection.disconnect();
    }
    this.connection = null;

    // Disconnect WebSocket
    if (this.wsConnection) {
      this.emit(BroadcastEvent.LOG, "Disconnecting ws connection...");

      if (this.broadcastId) {
        this.wsConnection.send(
          JSON.stringify({
            type: "stop-broadcast",
            broadcastId: this.broadcastId,
          }),
        );
      }

      this.wsConnection.close();
      this.wsConnection = null;
    }

    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      this.wsClient.abort();
      this.wsClient = null;
    }

    // Reset state
    this._resetConnectingState();
    this.broadcastId = null;
    this.isBroadcastReady = false;
    this.incomingEvents = [];
    this.backupEvents = [];
    this.nextGameCursor = null;
    this._setSlippiStatus(ConnectionStatus.DISCONNECTED);
  }

  private _setupWsClientListeners(headers: Record<string, string | number>, config: StartBroadcastConfig) {
    Preconditions.checkExists(this.wsClient);

    this.wsClient.on("connectFailed", (err) => {
      this.emit(BroadcastEvent.LOG, `WS failed to connect`);

      const label = "x-websocket-reject-reason: ";
      let message = err.message;
      const pos = err.message.indexOf(label);
      if (pos >= 0) {
        const endPos = err.message.indexOf("\n", pos + label.length);
        message = message.substring(pos + label.length, endPos >= 0 ? endPos : undefined);
      }

      this.emit(BroadcastEvent.ERROR, message);

      // Retry with exponential backoff
      const currentTimeout = this.connectingRetryTimeout;
      this.retryTimer = setTimeout(() => {
        if (this.wsClient && SLIPPI_WS_SERVER) {
          this.emit(
            BroadcastEvent.LOG,
            `Retrying connecting sub step: ${this.connectingSubStep} after ${currentTimeout}ms`,
          );
          this.wsClient.connect(SLIPPI_WS_SERVER, "broadcast-protocol", undefined, headers);
        }
      }, currentTimeout);

      this.connectingRetryTimeout = Math.min(this.connectingRetryTimeout * 2, CONNECTING_SUB_STEP_MAX_TIMEOUT);
    });

    this.wsClient.on("connect", (connection: connection) => {
      this.connectingSubStep = ConnectingSubStep.GET;
      this.connectingRetryTimeout = CONNECTING_SUB_STEP_INITIAL_TIMEOUT;

      this.emit(BroadcastEvent.LOG, "WS connection successful");
      this.wsConnection = connection;

      this._setupWsConnectionListeners(connection, config);

      // Start the get-broadcasts flow
      this._sendGetBroadcasts().catch(console.warn);

      // Setup retry timer for sub-steps
      this._scheduleSubStepRetry(config);
    });
  }

  private _setupWsConnectionListeners(connection: connection, config: StartBroadcastConfig) {
    connection.on("error", (err) => {
      this.emit(BroadcastEvent.ERROR, err);
    });

    connection.on("close", (code: number, reason: string) => {
      this.emit(BroadcastEvent.LOG, `WS connection closed: ${code}, ${reason}`);

      this.wsConnection = null;
      this.isBroadcastReady = false;

      if (code === 1006) {
        // Abnormal disconnect - try to reconnect
        this._setSlippiStatus(ConnectionStatus.RECONNECT_WAIT);
        this.emit(BroadcastEvent.RECONNECT, config);
      } else {
        // Normal close - clean up everything
        this.connection?.disconnect();
        this._setSlippiStatus(ConnectionStatus.DISCONNECTED);
      }
    });

    connection.on("message", (data: Message) => {
      if (data.type !== "utf8" || !data.utf8Data) {
        return;
      }

      let message: WsMessage;
      try {
        message = JSON.parse(data.utf8Data);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        this.emit(BroadcastEvent.LOG, `Failed to parse message from server\n${errMsg}\n${data.utf8Data}`);
        return;
      }

      this.emit(BroadcastEvent.LOG, message);
      this._handleWsMessage(message, config);
    });
  }

  private _handleWsMessage(message: WsMessage, config: StartBroadcastConfig) {
    switch (message.type) {
      case "start-broadcast-resp":
        this._handleStartBroadcastResp(message, config);
        break;
      case "get-broadcasts-resp":
        this._handleGetBroadcastsResp(message, config);
        break;
    }
  }

  private _handleStartBroadcastResp(
    message: Extract<WsMessage, { type: "start-broadcast-resp" }>,
    _config: StartBroadcastConfig,
  ) {
    if (message.recoveryGameCursor !== undefined) {
      this._recoverFromCursor(message.recoveryGameCursor);
    }

    if (message.broadcastId) {
      this._connectionComplete(message.broadcastId);
    }
  }

  private _recoverFromCursor(recoveryGameCursor: number) {
    const firstIncoming = this.incomingEvents[0];
    const firstCursor = firstIncoming?.cursor;

    this.emit(
      BroadcastEvent.LOG,
      `Picking broadcast back up from ${recoveryGameCursor}. Last not sent: ${firstCursor}`,
    );

    // Find events that need to be resent
    const eventsToResend = this.backupEvents.filter((event) => {
      if (event.cursor === null) {
        return false;
      }
      const isNeededByServer = event.cursor > recoveryGameCursor;
      const isNotIncoming = firstCursor == null || event.cursor < firstCursor;
      return isNeededByServer && isNotIncoming;
    });

    this.incomingEvents = [...eventsToResend, ...this.incomingEvents];

    const newFirstCursor = this.incomingEvents[0]?.cursor;
    const firstBackupCursor = this.backupEvents[0]?.cursor;
    const lastBackupCursor = last(this.backupEvents)?.cursor;

    this.emit(
      BroadcastEvent.LOG,
      `Backup events include range from: [${firstBackupCursor}, ${lastBackupCursor}]. Next cursor to be sent: ${newFirstCursor}`,
    );
  }

  private _handleGetBroadcastsResp(
    message: Extract<WsMessage, { type: "get-broadcasts-resp" }>,
    config: StartBroadcastConfig,
  ) {
    this.connectingSubStep = ConnectingSubStep.START;
    this.connectingRetryTimeout = CONNECTING_SUB_STEP_INITIAL_TIMEOUT;

    const broadcasts = message.broadcasts || [];

    // Try to reuse existing broadcast if reconnecting
    if (this.broadcastId) {
      const broadcastsById = keyBy(broadcasts, "id");
      const prevBroadcast = broadcastsById[this.broadcastId];

      if (prevBroadcast) {
        this._sendStartBroadcast(prevBroadcast.id, config.name).catch(console.warn);
        return;
      }
    }

    // Start new broadcast
    this._sendStartBroadcast(null, config.name).catch(console.warn);
  }

  private _connectionComplete(broadcastId: string) {
    this.emit(BroadcastEvent.LOG, `Starting broadcast to: ${broadcastId}`);

    // Clear backup events when connection completes
    this.backupEvents = [];
    this.isBroadcastReady = true;
    this.broadcastId = broadcastId;

    this._resetConnectingState();
    this._setSlippiStatus(ConnectionStatus.CONNECTED);

    // Process any pending events
    this._handleGameData();
  }

  private async _sendGetBroadcasts(): Promise<void> {
    if (!this.wsConnection) {
      return;
    }

    this.wsConnection.send(
      JSON.stringify({
        type: "get-broadcasts",
      }),
    );
  }

  private async _sendStartBroadcast(broadcastId: string | null, name?: string): Promise<void> {
    if (!this.wsConnection) {
      return;
    }

    this.connectingSubStep = ConnectingSubStep.START;
    this.wsConnection.send(
      JSON.stringify({
        type: "start-broadcast",
        name: name ?? "Netplay",
        broadcastId,
      }),
    );
  }

  private _scheduleSubStepRetry(config: StartBroadcastConfig) {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      if (this.connectingSubStep === ConnectingSubStep.NONE || !this.wsClient) {
        return;
      }

      this.emit(
        BroadcastEvent.LOG,
        `Retrying connecting sub step: ${this.connectingSubStep} after ${this.connectingRetryTimeout}ms`,
      );

      this.connectingRetryTimeout = Math.min(this.connectingRetryTimeout * 2, CONNECTING_SUB_STEP_MAX_TIMEOUT);

      if (this.connectingSubStep === ConnectingSubStep.GET) {
        this._sendGetBroadcasts().catch(console.warn);
      } else if (this.connectingSubStep === ConnectingSubStep.START) {
        this._sendStartBroadcast(this.broadcastId, config.name).catch(console.warn);
      }

      this._scheduleSubStepRetry(config);
    }, this.connectingRetryTimeout);
  }

  private _resetConnectingState() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.connectingSubStep = ConnectingSubStep.NONE;
    this.connectingRetryTimeout = CONNECTING_SUB_STEP_INITIAL_TIMEOUT;
  }

  private setupGameSourceListeners() {
    Preconditions.checkExists(this.connection);

    if (this.connection instanceof ConsoleConnection) {
      this._setupConsoleConnectionListeners(this.connection);
    }

    this.connection.on(ConnectionEvent.STATUS_CHANGE, (status: number) => {
      this.emit(BroadcastEvent.LOG, `Game source status change: ${status}`);
      this.emit(BroadcastEvent.DOLPHIN_STATUS_CHANGE, status);

      if (status === ConnectionStatus.DISCONNECTED) {
        // Inject end game message if we have an active game
        if (this.nextGameCursor !== null) {
          this._queueEvent({
            type: DolphinMessageType.END_GAME,
            cursor: this.nextGameCursor,
            nextCursor: this.nextGameCursor,
            payload: "",
          });
        }

        this._handleGameData();
        this.stop();
      }
    });

    this.connection.on(ConnectionEvent.MESSAGE, (message: unknown) => {
      this._queueEvent(message as SlippiBroadcastPayloadEvent);
      this._handleGameData();
    });

    this.connection.on(ConnectionEvent.ERROR, (err) => {
      if (err) {
        this.emit(BroadcastEvent.ERROR, err);
      }
    });
  }

  private _setupConsoleConnectionListeners(consoleConnection: ConsoleConnection) {
    let ready = false;
    let cursor = 0;
    let payloads: Buffer[] = [];

    const slippiStream = new SlpStream({
      mode: SlpStreamMode.AUTO,
    });

    const EVENTS_TO_SEND = [
      Command.MESSAGE_SIZES,
      Command.GAME_START,
      Command.FRAME_BOOKEND,
      Command.GAME_END,
      Command.SPLIT_MESSAGE,
    ];

    slippiStream.on(SlpStreamEvent.RAW, (data: SlpRawEventPayload) => {
      this.emit(BroadcastEvent.LOG, `new raw: ${JSON.stringify(data)}`);

      // Game starting - inject start_game event
      if (data.command === Command.MESSAGE_SIZES) {
        ready = true;
        this._queueEvent({
          cursor,
          nextCursor: cursor + 1,
          type: DolphinMessageType.START_GAME,
        } as SlippiBroadcastPayloadEvent);
        cursor++;
      }

      if (!ready) {
        return;
      }

      payloads.push(Buffer.from(data.payload));

      // Only flush on specific events
      if (!EVENTS_TO_SEND.includes(data.command)) {
        return;
      }

      this._queueEvent({
        cursor,
        nextCursor: cursor + 1,
        type: data.command === Command.GAME_END ? DolphinMessageType.END_GAME : DolphinMessageType.GAME_EVENT,
        payload: Buffer.concat(payloads).toString("base64"),
      });

      payloads = [];
      cursor++;

      if (data.command === Command.GAME_END) {
        ready = false;
      }
    });

    consoleConnection.on(ConnectionEvent.DATA, (data) => {
      this.emit(BroadcastEvent.LOG, "received data");
      slippiStream.process(data);
    });
  }

  private _queueEvent(event: SlippiBroadcastPayloadEvent) {
    this.incomingEvents.push(event);
  }

  /**
   * Initiates a connection to the game source but only resolves when it's actually connected.
   * The promise rejects if not connected before the timeout.
   */
  private async _connectToGameSource(ip: string, port: number, timeout = 5000): Promise<void> {
    Preconditions.checkExists(this.connection);

    if (this.connection.getStatus() === ConnectionStatus.CONNECTED) {
      return;
    }

    return new Promise((resolve, reject) => {
      Preconditions.checkExists(this.connection);

      const timer = setTimeout(() => {
        reject(new Error(`Game source connection request timed out after ${timeout}ms`));
      }, timeout);

      const connectionChangeHandler = (status: number) => {
        Preconditions.checkExists(this.connection);
        this.emit(BroadcastEvent.LOG, `connectionStatusChange: ${status}`, {
          status,
        });

        if (status === ConnectionStatus.CONNECTED) {
          this.connection!.removeListener(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);
          clearTimeout(timer);
          resolve();
        } else if (status === ConnectionStatus.DISCONNECTED) {
          this.connection!.removeListener(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);
          clearTimeout(timer);
          reject(new Error("Broadcast manager failed to connect to game source"));
        }
      };

      this.connection!.on(ConnectionEvent.STATUS_CHANGE, connectionChangeHandler);
      this.connection!.connect(ip, port).catch(reject);
    });
  }

  private _handleGameData() {
    // Wait until broadcast is ready to avoid sending stale data during reconnection
    if (!this.broadcastId || !this.wsConnection || !this.isBroadcastReady) {
      return;
    }

    while (this.incomingEvents.length > 0) {
      const event = this.incomingEvents.shift();
      if (!event) {
        continue;
      }

      // Add to backup for potential recovery
      this._addToBackup(event);

      // Only forward specific message types
      if (!["start_game", "game_event", "end_game"].includes(event.type)) {
        continue;
      }

      // Skip empty game_event payloads
      if (event.type === "game_event" && !event.payload) {
        continue;
      }

      if ("nextCursor" in event && event.nextCursor) {
        this.nextGameCursor = event.nextCursor;
      }

      const message = {
        type: "send-event",
        broadcastId: this.broadcastId,
        event,
      };

      this.wsConnection.send(JSON.stringify(message), (err) => {
        if (err) {
          this.emit(BroadcastEvent.ERROR, err);
        }
      });
    }
  }

  private _addToBackup(event: SlippiBroadcastPayloadEvent) {
    this.backupEvents.push(event);
    if (this.backupEvents.length > BACKUP_MAX_LENGTH) {
      this.backupEvents.shift();
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
