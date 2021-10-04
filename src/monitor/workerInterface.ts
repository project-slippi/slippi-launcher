import { ipc_externalDolphinClosedEvent, ipc_externalDolphinOpenedEvent } from "@dolphin/ipc";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as ProcessMonitorWorkerMethods, WorkerSpec as ProcessMonitorWorkerSpec } from "./processMonitorWorker";

const log = electronLog.scope("monitor/workerInterface");
const processMonitorLog = electronLog.scope("processMonitor");

export const processMonitorWorker: Promise<Thread & ProcessMonitorWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("process: Spawning worker");

  spawn<ProcessMonitorWorkerSpec>(new Worker("./processMonitorWorker"), { timeout: 30000 })
    .then((worker) => {
      worker.getLogObservable().subscribe((logMessage) => {
        processMonitorLog.info(logMessage);
      });
      worker.getErrorObservable().subscribe((errorMessage) => {
        processMonitorLog.error(errorMessage);
      });
      worker.getProcessStatusObservable().subscribe(({ externalOpened }) => {
        if (externalOpened) {
          void ipc_externalDolphinOpenedEvent.main!.trigger({});
        } else {
          void ipc_externalDolphinClosedEvent.main!.trigger({});
        }
      });

      log.debug("process: Done spawning worker");

      async function terminateWorker() {
        log.debug("process: Terminating worker");
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
