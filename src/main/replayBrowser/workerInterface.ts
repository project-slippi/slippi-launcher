// import { app } from "electron";
// import log from "electron-log";
// import os from "os";
// import { Pool as spawnPool, spawn, Worker } from "threads";

// import { WorkerSpec } from "./worker";

// const workerPool = spawnPool(() => spawn<WorkerSpec>(new Worker("./worker")), os.cpus().length);
// log.debug("replayBrowser: Spawning pool");

// async function terminatePool() {
//   log.debug("replayBrowser: Terminating pool");
//   await workerPool.terminate();
// }
// app.on("quit", terminatePool);

// export const loadReplayFile = async (fullPath: string) => await workerPool.queue((w) => w.loadReplayFile(fullPath));

import { app } from "electron";
import log from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { Methods as WorkerMethods, WorkerSpec } from "./worker";

export const worker: Promise<Thread & WorkerMethods> = new Promise((resolve, reject) => {
  log.debug("replayBrowser: Spawning worker");

  spawn<WorkerSpec>(new Worker("./worker"))
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
    .catch(reject);
});
