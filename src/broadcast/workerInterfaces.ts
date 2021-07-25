import { dolphinManager } from "@dolphin/manager";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as BroadcastWorkerMethods, WorkerSpec as BroadcastWorkerSpec } from "./broadcastWorker";
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastListUpdatedEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
} from "./ipc";
import { Methods as SpectateWorkerMethods, WorkerSpec as SpectateWorkerSpec } from "./spectateWorker";
import { BroadcasterItem } from "./types";

const log = electronLog.scope("broadcast/workerInterface");

export const broadcastWorker: Promise<Thread & BroadcastWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("broadcast: Spawning worker");

  spawn<BroadcastWorkerSpec>(new Worker("./broadcastWorker"), { timeout: 30000 })
    .then((worker) => {
      worker.getDolphinStatusObservable().subscribe(({ status }) => {
        log.info(`got dolphin status: ${status}`);
        ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(log.error);
      });
      worker.getSlippiStatusObservable().subscribe(({ status }) => {
        log.info(`got slippi status: ${status}`);
        ipc_slippiStatusChangedEvent.main!.trigger({ status }).catch(log.error);
      });
      worker.getErrorObservable().subscribe((errorMessage) => {
        log.info(`got error message: ${errorMessage}`);
        ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(log.error);
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
        ipc_broadcastListUpdatedEvent.main!.trigger({ items: data }).catch(log.error);
      });
      worker.getErrorObservable().subscribe((errorMessage) => {
        log.info(`got error message: ${errorMessage}`);
        ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(log.error);
      });
      worker.getSpectateDetailsObservable().subscribe(({ playbackId, replayComm }) => {
        dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(log.error);
      });

      dolphinManager.on("dolphin-closed", (playbackId: string) => {
        worker.dolphinClosed(playbackId).catch(log.error);
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
