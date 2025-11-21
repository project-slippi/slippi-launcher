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

export class SpectateRemoteServer {
  private spectateController: SpectateController | null = null;
  private broadcastListSubscription: Subscription<BroadcasterItem[]> | null = null;
  private spectateDetailsSubscription: Subscription<{
    playbackId: string;
    filePath: string;
    broadcasterName: string;
  }> | null = null;
  private gameEndSubscription: Subscription<string> | null = null;
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
          this.connection.sendUTF(JSON.stringify({ op: "dolphin-closed-event", dolphinId: event.instanceId }));
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
        this.connection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", err }));
      }
    }, 2000);
  }

  private async setupSpectateController() {
    this.spectateController = await this.getSpectateController();
    this.broadcastListSubscription = this.spectateController
      .getBroadcastListObservable()
      .subscribe((data: BroadcasterItem[]) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", broadcasts: data }));
        }
      });
    this.spectateDetailsSubscription = this.spectateController
      .getSpectateDetailsObservable()
      .subscribe(async ({ playbackId, filePath }) => {
        if (this.connection && filePath) {
          this.connection.sendUTF(JSON.stringify({ op: "new-file-event", dolphinId: playbackId, filePath }));
        }
      });
    this.gameEndSubscription = this.spectateController.getGameEndObservable().subscribe((dolphinId: string) => {
      if (this.connection) {
        this.connection.sendUTF(JSON.stringify({ op: "game-end-event", dolphinId }));
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
          op: "spectating-broadcasts-event",
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
    if (json.op === "list-broadcasts-request") {
      await this.throttledRefresh();
    } else if (json.op === "spectate-broadcast-request") {
      const broadcastId = json.broadcastId;
      if (!broadcastId || typeof broadcastId !== "string") {
        this.connection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err: "no broadcastId" }));
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
        this.connection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", dolphinId, path }));
      } catch (e) {
        const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
        this.connection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err }));
      }
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
