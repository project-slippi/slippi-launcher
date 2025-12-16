import type { BroadcasterItem, SpectateController, SpectateDolphinOptions } from "@broadcast/types";
import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import type { SettingsManager } from "@settings/settings_manager";
import electronLog from "electron-log";
import http from "http";
import throttle from "lodash/throttle";
import type { AddressInfo } from "net";
import type { Subscription } from "observable-fns";
import type { connection, Message, request } from "websocket";
import { server as WebSocketServer } from "websocket";

import { ipc_spectateRemoteStateEvent } from "./ipc";

const SPECTATE_PROTOCOL = "spectate-protocol";
const log = electronLog.scope("spectate_remote_server");

const CONNECTION_TIMEOUT_MS = 20000;

enum EVENT_OP {
  DOLPHIN_CLOSED = "dolphin-closed-event",
  GAME_END = "game-end-event",
  NEW_FILE = "new-file-event",
  SPECTATING_BROADCASTS = "spectating-broadcasts-event",
}

enum REQUEST_OP {
  LIST_BROADCASTS = "list-broadcasts-request",
  SPECTATE_BROADCAST = "spectate-broadcast-request",
  STOP_BROADCAST = "stop-broadcast-request",
}

enum RESPONSE_OP {
  LIST_BROADCASTS = "list-broadcasts-response",
  SPECTATE_BROADCAST = "spectate-broadcast-response",
  STOP_BROADCAST = "stop-broadcast-response",
}

export class SpectateRemoteServer {
  private spectateController: SpectateController | null = null;
  private broadcastListSubscription: Subscription<BroadcasterItem[]> | null = null;
  private spectateDetailsSubscription: Subscription<{
    dolphinId: string;
    filePath: string;
    broadcasterName: string;
  }> | null = null;
  private gameEndSubscription: Subscription<{ broadcastId: string; dolphinId: string }> | null = null;
  private httpServer: http.Server | null = null;
  private spectateRemoteServer: WebSocketServer | null = null;
  private connection: connection | null = null;
  private throttledRefresh: (() => void) & { cancel: () => void };

  private prefixOrdinal = 0;

  constructor(
    private readonly dolphinManager: DolphinManager,
    private readonly settingsManager: SettingsManager,
    private readonly getSpectateController: () => Promise<SpectateController>,
  ) {
    this.dolphinManager.events
      .filter<DolphinPlaybackClosedEvent>((event) => {
        return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
      })
      .subscribe(async (event) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: EVENT_OP.DOLPHIN_CLOSED, dolphinId: event.instanceId }));
        }
      });

    this.throttledRefresh = throttle(async () => {
      if (!this.connection) {
        return;
      }

      try {
        await this.spectateController!.refreshBroadcastList();
      } catch (e) {
        const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
        this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.LIST_BROADCASTS, err }));
      }
    }, 2000);
  }

  private async setupSpectateController() {
    this.spectateController = await this.getSpectateController();
    this.broadcastListSubscription = this.spectateController
      .getBroadcastListObservable()
      .subscribe((data: BroadcasterItem[]) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.LIST_BROADCASTS, broadcasts: data }));
        }
      });
    this.spectateDetailsSubscription = this.spectateController
      .getSpectateDetailsObservable()
      .subscribe(({ broadcastId, dolphinId, filePath }) => {
        if (this.connection && filePath) {
          this.connection.sendUTF(JSON.stringify({ op: EVENT_OP.NEW_FILE, broadcastId, dolphinId, filePath }));
        }
      });
    this.gameEndSubscription = this.spectateController
      .getGameEndObservable()
      .subscribe(({ broadcastId, dolphinId, filePath }) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: EVENT_OP.GAME_END, broadcastId, dolphinId, filePath }));
        }
      });
  }

  public async start(initialAuthToken: string, port: number): Promise<void> {
    if (!this.spectateController) {
      await this.setupSpectateController();
    }
    const errObservable = this.spectateController!.getErrorObservable();
    const errorPromise = new Promise<void>((resolve, reject) => {
      const subscription = errObservable.subscribe({
        next: (err: Error | string) => {
          subscription.unsubscribe();
          reject(typeof err === "string" ? new Error(err) : err);
        },
        error: (err: any) => {
          subscription.unsubscribe();
          reject(typeof err === "string" ? new Error(err) : err);
        },
      });
    });

    const timeout = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Timed out after ${CONNECTION_TIMEOUT_MS / 1000}s trying to connect to spectate controller.`));
      }, CONNECTION_TIMEOUT_MS);
    });

    try {
      await Promise.race([errorPromise, timeout, this.connectToSpectateController(initialAuthToken, port)]);
    } catch (err) {
      // Clean up whatever we were doing before throwing the error.
      // We can't do this in the finally block or we will indescriminately stop the server.
      this.stop();

      throw err;
    }
  }

  private async connectToSpectateController(initialAuthToken: string, port: number): Promise<void> {
    if (!this.spectateController) {
      await this.setupSpectateController();
    }
    await this.spectateController!.connect(initialAuthToken);

    if (this.httpServer && this.spectateRemoteServer) {
      if ((<AddressInfo>this.httpServer.address()).port === port) {
        return;
      } else {
        throw new Error(`server already started on port ${port}`);
      }
    }

    try {
      this.httpServer = http.createServer();
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.once("error", (e) => {
          reject(e);
        });
        this.httpServer!.listen(
          port,
          "127.0.0.1", // allow only local conenctions
          511, // default backlog queue length
          () => {
            this.httpServer!.removeAllListeners("error");
            ipc_spectateRemoteStateEvent.main!.trigger({ connected: false, started: true, port }).catch(log.error);
            resolve();
          },
        );
      });

      this.spectateRemoteServer = new WebSocketServer({ httpServer: this.httpServer });
      this.spectateRemoteServer.on("request", (request) => {
        this.handleSpectateRemoteServerRequest(request).catch((err) => {
          log.error(err);
        });
      });
      return;
    } catch (e: any) {
      if (e.code === "EADDRINUSE") {
        throw new Error("Port in use");
      }
      const err =
        typeof e === "string"
          ? new Error(e)
          : e instanceof Error
          ? e
          : new Error("Error connecting to spectate controller");
      throw err;
    }
  }

  private async handleSpectateRemoteServerRequest(request: request) {
    if (!this.connection && request.requestedProtocols.includes(SPECTATE_PROTOCOL)) {
      this.connection = request.accept(SPECTATE_PROTOCOL, request.origin);
      this.connection.on("message", (data) => {
        void this.handleConnectionMessage(data);
      });
      this.connection.on("close", () => {
        this.handleConnectionClose();
      });
      ipc_spectateRemoteStateEvent.main!.trigger({ connected: true, started: true }).catch(log.error);
      this.connection.sendUTF(
        JSON.stringify({
          op: EVENT_OP.SPECTATING_BROADCASTS,
          spectatingBroadcasts: await this.spectateController!.getOpenBroadcasts(),
        }),
      );
    } else {
      request.reject();
    }
  }

  private async handleConnectionMessage(data: Message) {
    if (this.connection === null || data.type === "binary") {
      return;
    }

    const json = JSON.parse(data.utf8Data);
    switch (json.op) {
      case REQUEST_OP.LIST_BROADCASTS:
        await this.throttledRefresh();
        break;
      case REQUEST_OP.SPECTATE_BROADCAST: {
        const broadcastId = json.broadcastId;
        if (!broadcastId || typeof broadcastId !== "string") {
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.SPECTATE_BROADCAST, err: "no broadcastId" }));
          return;
        }

        const dolphinOptions: SpectateDolphinOptions = {};
        const dolphinId = json.dolphinId;
        if (dolphinId && typeof dolphinId === "string") {
          dolphinOptions.dolphinId = dolphinId;
        } else {
          dolphinOptions.idPostfix = `remote${this.prefixOrdinal}`;
          this.prefixOrdinal += 1;
        }
        try {
          const path = this.settingsManager.get().settings.spectateSlpPath;
          const dolphinId = await this.spectateController!.startSpectate(broadcastId, path, dolphinOptions);
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.SPECTATE_BROADCAST, broadcastId, dolphinId, path }));
        } catch (e) {
          const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.SPECTATE_BROADCAST, err }));
        }
        break;
      }
      case REQUEST_OP.STOP_BROADCAST: {
        const broadcastId = json.broadcastId;
        if (!broadcastId || typeof broadcastId !== "string") {
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.STOP_BROADCAST, err: "no broadcastId" }));
          return;
        }

        try {
          await this.spectateController!.stopSpectate(broadcastId);
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.STOP_BROADCAST, broadcastId }));
        } catch (e) {
          const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
          this.connection.sendUTF(JSON.stringify({ op: RESPONSE_OP.STOP_BROADCAST, err }));
        }
        break;
      }
      default:
        this.connection.sendUTF(JSON.stringify({ op: json.op, err: "unknown op" }));
    }
  }

  private handleConnectionClose() {
    this.connection = null;
    ipc_spectateRemoteStateEvent.main!.trigger({ connected: false, started: true }).catch(log.error);
  }

  public stop() {
    // Cancel any pending throttled refresh calls
    this.throttledRefresh.cancel();

    // Unsubscribe from spectate controller observables
    this.broadcastListSubscription?.unsubscribe();
    this.broadcastListSubscription = null;

    this.spectateDetailsSubscription?.unsubscribe();
    this.spectateDetailsSubscription = null;

    this.gameEndSubscription?.unsubscribe();
    this.gameEndSubscription = null;

    this.spectateController = null;

    // Close WebSocket connection
    this.connection?.removeAllListeners();
    this.connection?.close();
    this.connection = null;

    // Close HTTP server
    this.httpServer?.close();
    this.httpServer = null;

    // Shutdown WebSocket server
    this.spectateRemoteServer?.removeAllListeners();
    this.spectateRemoteServer?.shutDown();
    this.spectateRemoteServer = null;

    ipc_spectateRemoteStateEvent.main!.trigger({ connected: false, started: false }).catch(log.error);
  }
}
