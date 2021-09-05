import { dolphinManager } from "@dolphin/manager";
import { ReplayCommunication } from "@dolphin/types";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as BroadcastWorkerMethods, WorkerSpec as BroadcastWorkerSpec } from "./broadcastWorker";
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastListUpdatedEvent,
  ipc_broadcastReconnect,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
  ipc_spectateReconnect,
} from "./ipc";
import { Methods as SpectateWorkerMethods, WorkerSpec as SpectateWorkerSpec } from "./spectateWorker";
import { BroadcasterItem } from "./types";

const log = electronLog.scope("broadcast/workerInterface");
const broadcastLog = electronLog.scope("broadcastManager");
const spectateLog = electronLog.scope("spectateManager");

export const broadcastWorker: Promise<Thread & BroadcastWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("broadcast: Spawning worker");

  spawn<BroadcastWorkerSpec>(new Worker("./broadcastWorker"), { timeout: 30000 })
    .then((worker) => {
      worker.getDolphinStatusObservable().subscribe(({ status }) => {
        ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(broadcastLog.error);
      });
      worker.getSlippiStatusObservable().subscribe(({ status }) => {
        ipc_slippiStatusChangedEvent.main!.trigger({ status }).catch(broadcastLog.error);
      });
      worker.getLogObservable().subscribe((logMessage) => {
        broadcastLog.info(logMessage);
      });
      worker.getErrorObservable().subscribe((err) => {
        broadcastLog.error(err);
        const errorMessage = err instanceof Error ? err.message : err;
        ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(broadcastLog.error);
      });
      worker.getReconnectObservable().subscribe(({ config }) => {
        ipc_broadcastReconnect.main!.trigger({ config }).catch(broadcastLog.error);
      });

      log.debug("broadcast: Spawning worker: Done");

      async function terminateWorker() {
        log.debug("broadcast: Terminating worker");
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

export const spectateWorker: Promise<Thread & SpectateWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("spectate: Spawning worker");

  spawn<SpectateWorkerSpec>(new Worker("./spectateWorker"), { timeout: 30000 })
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
        ipc_spectateReconnect.main!.trigger({}).catch(spectateLog.error);
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
