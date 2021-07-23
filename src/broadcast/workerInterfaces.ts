import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as WorkerMethods, WorkerSpec } from "./broadcastWorker";
import { ipc_broadcastErrorOccurredEvent, ipc_dolphinStatusChangedEvent, ipc_slippiStatusChangedEvent } from "./ipc";

const log = electronLog.scope("broadcast/workerInterface");

export const broadcastWorker: Promise<Thread & WorkerMethods> = new Promise((resolve, reject) => {
  log.debug("broadcast: Spawning worker");

  spawn<WorkerSpec>(new Worker("./broadcastWorker"), { timeout: 30000 })
    .then((worker) => {
      worker.getDolphinStatusObservable().subscribe((status) => {
        log.info(`got dolphin status: ${status}`);
        ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(log.error);
      });
      worker.getSlippiStatusObservable().subscribe((status) => {
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
