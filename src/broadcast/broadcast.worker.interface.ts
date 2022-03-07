import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import type { Methods as BroadcastWorkerMethods, WorkerSpec as BroadcastWorkerSpec } from "./broadcast.worker";
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastReconnectEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
} from "./ipc";

const log = electronLog.scope("broadcast/broadcast.worker.interface");
const broadcastLog = electronLog.scope("broadcastManager");

export const broadcastWorker: Promise<Thread & BroadcastWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("broadcast: Spawning worker");

  spawn<BroadcastWorkerSpec>(new Worker("./broadcast.worker"), { timeout: 30000 })
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
        ipc_broadcastReconnectEvent.main!.trigger({ config }).catch(broadcastLog.error);
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
