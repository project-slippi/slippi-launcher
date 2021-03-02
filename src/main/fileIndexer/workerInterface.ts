import { app } from "electron";
import log from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as WorkerMethods, WorkerSpec } from "./worker";

export const worker: Promise<Thread & WorkerMethods> = new Promise((resolve, reject) => {
  log.debug("fileIndexer: Spawning worker");

  spawn<WorkerSpec>(new Worker("./worker"))
    .then((worker) => {
      log.debug("fileIndexer: Spawning worker: Done");

      async function terminateWorker() {
        log.debug("fileIndexer: Terminating worker");
        try {
          await worker.destroyWorker();
        } finally {
          await Thread.terminate(worker);
        }
      }

      app.on("quit", terminateWorker);

      Thread.events(worker).subscribe((evt) => {
        log.debug("fileIndexer: Worker event:", evt);
        // TODO: Respawn on worker exit?
      });

      resolve(worker);
    })
    .catch(reject);
});
