import type { BroadcasterItem } from "@broadcast/types";
import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent, ReplayCommunication } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import type { SettingsManager } from "@settings/settings_manager";
import log from "electron-log";
import http from "http";
import type { AddressInfo } from "net";
import type { connection } from "websocket";
import { server as WebSocketServer } from "websocket";

import type { SpectateWorker } from "./spectate.worker.interface";
import { createSpectateWorker } from "./spectate.worker.interface";

const SPECTATE_PROTOCOL = "spectate-protocol";

export default class RemoteServer {
  private dolphinManager: DolphinManager;
  private settingsManager: SettingsManager;
  private spectateWorkerPromise: Promise<SpectateWorker>;
  private authToken: string;

  private httpServer: http.Server | null;
  private remoteServer: WebSocketServer | null;
  private connection: connection | null;

  constructor(dolphinManager: DolphinManager, settingsManager: SettingsManager) {
    this.authToken = "";
    this.httpServer = null;
    this.remoteServer = null;
    this.connection = null;

    this.settingsManager = settingsManager;
    this.dolphinManager = dolphinManager;
    dolphinManager.events
      .filter<DolphinPlaybackClosedEvent>((event) => {
        return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
      })
      .subscribe(async (event) => {
        if (this.connection) {
          this.connection.sendUTF(JSON.stringify({ op: "dolphin-closed-event", dolphinId: event.instanceId }));
        }
        const spectateWorker = await this.spectateWorkerPromise;
        try {
          await spectateWorker.dolphinClosed(event.instanceId);
        } catch (e) {
          log.error(e);
        }
      });
    this.spectateWorkerPromise = createSpectateWorker();
    this.spectateWorkerPromise
      .then((spectateWorker) => {
        spectateWorker.getBroadcastListObservable().subscribe((data: BroadcasterItem[]) => {
          if (this.connection) {
            this.connection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", broadcasts: data }));
          }
        });
        spectateWorker.getSpectateDetailsObservable().subscribe(async ({ playbackId, filePath, broadcasterName }) => {
          const replayComm: ReplayCommunication = {
            mode: "mirror",
            replay: filePath,
            gameStation: broadcasterName,
          };
          try {
            await this.dolphinManager.launchPlaybackDolphin(playbackId, replayComm);
            if (this.connection && filePath) {
              this.connection.sendUTF(JSON.stringify({ op: "new-file-event", dolphinId: playbackId, filePath }));
            }
          } catch (e) {
            log.error(e);
          }
        });
        spectateWorker.getGameEndObservable().subscribe((dolphinId: string) => {
          if (this.connection) {
            this.connection.sendUTF(JSON.stringify({ op: "game-end-event", dolphinId }));
          }
        });
      })
      .catch(log.error);
  }

  public async start(authToken: string): Promise<number> {
    if (this.httpServer && this.remoteServer) {
      return (<AddressInfo>this.httpServer.address()).port;
    }

    this.authToken = authToken;
    try {
      const spectateWorker = await this.spectateWorkerPromise;

      this.httpServer = http.createServer();
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.once("error", (e) => {
          reject(e);
        });
        this.httpServer!.listen(
          0, // let the OS decide a port
          "localhost", // bind only to localhost
          511, // default backlog queue length
          () => {
            this.httpServer!.removeAllListeners("error");
            resolve();
          },
        );
      });

      this.remoteServer = new WebSocketServer({ httpServer: this.httpServer });
      this.remoteServer.on("request", async (request) => {
        if (!this.connection && request.requestedProtocols.includes(SPECTATE_PROTOCOL)) {
          const newConnection = request.accept(SPECTATE_PROTOCOL, request.origin);
          newConnection.on("message", async (data) => {
            if (data.type === "binary") {
              return;
            }

            const json = JSON.parse(data.utf8Data);
            if (json.op === "list-broadcasts-request") {
              try {
                await spectateWorker.refreshBroadcastList(this.authToken);
              } catch (e) {
                const message = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
                newConnection.sendUTF(JSON.stringify({ op: "list-broadcasts-response", err: message }));
              }
            }
            if (json.op === "spectate-broadcast-request") {
              if (!json.broadcastId) {
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err: "no broadcastId" }));
                return;
              }

              try {
                const path = this.settingsManager.get().settings.spectateSlpPath;
                const dolphinId = await spectateWorker.startSpectate(json.broadcastId, path);
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", dolphinId, path }));
              } catch (e) {
                const message = typeof e === "string" ? e : e instanceof Error ? e.message : "unknown";
                newConnection.sendUTF(JSON.stringify({ op: "spectate-broadcast-response", err: message }));
              }
            }
          });
          newConnection.on("close", () => {
            this.connection = null;
          });
          this.connection = newConnection;
        } else {
          request.reject();
        }
      });

      return (<AddressInfo>this.httpServer.address()).port;
    } catch (e: any) {
      return 0;
    }
  }

  public async reconnect(authToken: string) {
    if (!authToken) {
      return false;
    }

    this.authToken = authToken;
    const spectateWorker = await this.spectateWorkerPromise;
    try {
      await spectateWorker.refreshBroadcastList(this.authToken);
      return true;
    } catch (e) {
      return false;
    }
  }

  public stop() {
    this.connection = null;
    if (this.remoteServer) {
      this.remoteServer.shutDown();
      this.remoteServer = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
  }
}
