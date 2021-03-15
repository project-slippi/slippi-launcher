import { app } from "electron";
import log from "electron-log";
import path from "path";
import { spawn, Thread, Worker } from "threads";

import { Methods, WorkerSpec } from "./dbWorker";

let w: Thread & Methods;

export const worker: Promise<Thread & Methods> = new Promise((resolve, reject) => {
  if (w) {
    resolve(w);
  }
  log.debug("db: Spawning worker");

  spawn<WorkerSpec>(new Worker("./dbWorker"))
    .then((worker) => {
      log.debug("db: Spawning worker: Done");

      async function terminateWorker() {
        log.debug("db: Terminating worker");
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

      w = worker;
      w.connect(path.join(app.getPath("userData"), "sqlippi.db"));
      resolve(worker);
    })
    .catch(reject);
});
