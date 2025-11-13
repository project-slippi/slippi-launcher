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
  private throttledRefresh: () => void;

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

  public async start(initialAuthToken: string, port: number): Promise<{ success: boolean; err?: string }> {
    if (!this.spectateController) {
      await this.setupSpectateController();
    }
    await this.spectateController!.connect(initialAuthToken);

    if (this.httpServer && this.spectateRemoteServer) {
      return (<AddressInfo>this.httpServer.address()).port === port
        ? { success: true }
        : { success: false, err: `server already started on port ${port}` };
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
        void this.handleSpectateRemoteServerRequest(request);
      });
      return { success: true };
    } catch (e: any) {
      if (e.code === "EADDRINUSE") {
        return { success: false, err: "Port in use" };
      }
      const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
      return { success: false, err };
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
    if (this.broadcastListSubscription) {
      this.broadcastListSubscription.unsubscribe();
      this.broadcastListSubscription = null;
    }
    if (this.spectateDetailsSubscription) {
      this.spectateDetailsSubscription.unsubscribe();
      this.spectateDetailsSubscription = null;
    }
    if (this.gameEndSubscription) {
      this.gameEndSubscription.unsubscribe();
      this.gameEndSubscription = null;
    }
    if (this.httpServer && this.spectateRemoteServer) {
      if (this.connection) {
        this.connection.removeAllListeners();
        this.connection = null;
      }
      this.httpServer.close();
      this.httpServer = null;
      this.spectateRemoteServer.shutDown();
      this.spectateRemoteServer = null;
      ipc_spectateRemoteStateEvent.main!.trigger({ connected: false, started: false }).catch(log.error);
    }
  }
}
