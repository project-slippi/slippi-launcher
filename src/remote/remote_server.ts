import type { BroadcasterItem, SpectateController, SpectateDolphinOptions } from "@broadcast/types";
import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent, ReplayCommunication } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import type { SettingsManager } from "@settings/settings_manager";
import electronLog from "electron-log";
import http from "http";
import throttle from "lodash/throttle";
import type { AddressInfo } from "net";
import type { connection } from "websocket";
import { server as WebSocketServer } from "websocket";

import { ipc_remoteStateEvent } from "./ipc";

const SPECTATE_PROTOCOL = "spectate-protocol";
const log = electronLog.scope("remote_server");

export class RemoteServer {
  private dolphinLaunchTimes: Map<string, number>;

  private spectateController: SpectateController | null;
  private httpServer: http.Server | null;
  private remoteServer: WebSocketServer | null;
  private connection: connection | null;

  private prefixOrdinal: number;

  constructor(
    private readonly dolphinManager: DolphinManager,
    private readonly settingsManager: SettingsManager,
    private readonly getSpectateController: () => Promise<SpectateController>,
  ) {
    this.dolphinLaunchTimes = new Map();
    this.spectateController = null;
    this.httpServer = null;
    this.remoteServer = null;
    this.connection = null;
    this.prefixOrdinal = 0;

    dolphinManager.events
      .filter<DolphinPlaybackClosedEvent>((event) => {
        return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
      })
      .subscribe(async (event) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: "dolphin-closed-event", dolphinId: event.instanceId }));
        }
        if (this.spectateController) {
          try {
            await this.spectateController.dolphinClosed(event.instanceId);
          } catch (e) {
            log.error(e);
          }
        }
      });
  }

  private async launchPlaybackDolphin(playbackId: string, filePath: string, replayComm: ReplayCommunication) {
    try {
      await this.dolphinManager.launchPlaybackDolphin(playbackId, replayComm);
      if (this.connection && filePath) {
        this.connection.sendUTF(JSON.stringify({ op: "new-file-event", dolphinId: playbackId, filePath }));
      }
    } catch (e) {
      log.error(e);
    }
  }

  private async setupSpectateController() {
    this.spectateController = await this.getSpectateController();
    this.spectateController.getBroadcastListObservable().subscribe((data: BroadcasterItem[]) => {
      if (this.connection) {
        this.connection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", broadcasts: data }));
      }
    });
    this.spectateController
      .getSpectateDetailsObservable()
      .subscribe(async ({ playbackId, filePath, broadcasterName }) => {
        const replayComm: ReplayCommunication = {
          mode: "mirror",
          replay: filePath,
          gameStation: broadcasterName,
        };
        await new Promise<void>((resolve, reject) => {
          const dolphinLaunchTime = this.dolphinLaunchTimes.get(playbackId);
          if (dolphinLaunchTime !== undefined) {
            const diff = Date.now() - dolphinLaunchTime;
            if (diff < 1000) {
              setTimeout(async () => {
                try {
                  await this.launchPlaybackDolphin(playbackId, filePath, replayComm);
                  this.dolphinLaunchTimes.set(playbackId, Date.now());
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }, 1000 - diff);
              return;
            }
          }
          this.launchPlaybackDolphin(playbackId, filePath, replayComm)
            .then(() => {
              this.dolphinLaunchTimes.set(playbackId, Date.now());
              resolve();
            })
            .catch((e) => {
              reject(e);
            });
        });
      });
    this.spectateController.getGameEndObservable().subscribe((dolphinId: string) => {
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

    if (this.httpServer && this.remoteServer) {
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
          "localhost", // bind only to localhost
          511, // default backlog queue length
          () => {
            this.httpServer!.removeAllListeners("error");
            ipc_remoteStateEvent.main!.trigger({ connected: false, started: true, port }).catch(log.error);
            resolve();
          },
        );
      });

      this.remoteServer = new WebSocketServer({ httpServer: this.httpServer });
      this.remoteServer.on("request", async (request) => {
        if (!this.connection && request.requestedProtocols.includes(SPECTATE_PROTOCOL)) {
          const newConnection = request.accept(SPECTATE_PROTOCOL, request.origin);
          const throttledRefresh = throttle(async () => {
            try {
              await this.spectateController!.refreshBroadcastList();
            } catch (e) {
              const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
              newConnection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", err }));
            }
          }, 2000);
          newConnection.on("message", async (data) => {
            if (data.type === "binary") {
              return;
            }

            const json = JSON.parse(data.utf8Data);
            if (json.op === "list-broadcasts-request") {
              await throttledRefresh();
            } else if (json.op === "spectate-broadcast-request") {
              const broadcastId = json.broadcastId;
              if (!broadcastId || typeof broadcastId !== "string") {
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err: "no broadcastId" }));
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
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", dolphinId, path }));
              } catch (e) {
                const err = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err }));
              }
            }
          });
          newConnection.on("close", () => {
            this.connection = null;
            ipc_remoteStateEvent.main!.trigger({ connected: false, started: true }).catch(log.error);
          });
          this.connection = newConnection;
          ipc_remoteStateEvent.main!.trigger({ connected: true, started: true }).catch(log.error);
        } else {
          request.reject();
        }
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

  public stop() {
    if (this.httpServer && this.remoteServer) {
      if (this.connection) {
        this.connection.removeAllListeners();
        this.connection = null;
      }
      this.httpServer.close();
      this.httpServer = null;
      this.remoteServer.shutDown();
      this.remoteServer = null;
      ipc_remoteStateEvent.main!.trigger({ connected: false, started: false }).catch(log.error);
    }
  }
}
