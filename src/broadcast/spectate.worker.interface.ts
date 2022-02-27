import { dolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { ipc_broadcastErrorOccurredEvent, ipc_broadcastListUpdatedEvent, ipc_spectateReconnectEvent } from "./ipc";
import type { Methods as SpectateWorkerMethods, WorkerSpec as SpectateWorkerSpec } from "./spectate.worker";
import type { BroadcasterItem } from "./types";

const log = electronLog.scope("broadcast/spectate.worker.interface");
const spectateLog = electronLog.scope("spectateManager");

export const spectateWorker: Promise<Thread & SpectateWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("spectate: Spawning worker");

  spawn<SpectateWorkerSpec>(new Worker("./spectate.worker"), { timeout: 30000 })
    .then((worker) => {
      worker.getBroadcastListObservable().subscribe((data: BroadcasterItem[]) => {
        ipc_broadcastListUpdatedEvent.main!.trigger({ items: data }).catch(spectateLog.error);
      });
      worker.getLogObservable().subscribe((logMessage) => {
        spectateLog.info(logMessage);
      });
      worker.getErrorObservable().subscribe((err) => {
        spectateLog.error(err);
        const errorMessage = err instanceof Error ? err.message : err;
        ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(spectateLog.error);
      });
      worker.getSpectateDetailsObservable().subscribe(({ playbackId, filePath }) => {
        const replayComm: ReplayCommunication = {
          mode: "mirror",
          replay: filePath,
        };
        dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(spectateLog.error);
      });
      worker.getReconnectObservable().subscribe(() => {
        ipc_spectateReconnectEvent.main!.trigger({}).catch(spectateLog.error);
      });

      dolphinManager.on("playback-dolphin-closed", (playbackId: string) => {
        worker.dolphinClosed(playbackId).catch(spectateLog.error);
      });

      log.debug("spectate: Spawning worker: Done");

      async function terminateWorker() {
        log.debug("spectate: Terminating worker");
        try {
          await worker.destroyWorker();
        } finally {
          await Thread.terminate(worker);
        }
      }

      app.on("quit", terminateWorker);

      // Thread.events(worker).subscribe((evt) => {
      //   log.debug("replayBrowser: Worker event:", evt);
      //   // TODO: Respawn on worker exit?
      // });

      resolve(worker);
    })
    .catch((err) => {
      log.error(err);
      reject(err);
    });
});
