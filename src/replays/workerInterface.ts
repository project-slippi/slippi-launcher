import { app } from "electron";
import log from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as WorkerMethods, WorkerSpec } from "./worker";

export const worker: Promise<Thread & WorkerMethods> = new Promise((resolve, reject) => {
  log.debug("replayBrowser: Spawning worker");

  spawn<WorkerSpec>(new Worker("./worker"), { timeout: 30000 })
    .then((worker) => {
      log.debug("replayBrowser: Spawning worker: Done");

      async function terminateWorker() {
        log.debug("replayBrowser: Terminating worker");
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
