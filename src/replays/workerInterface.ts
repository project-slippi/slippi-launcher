import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { ipc_fileLoadCompleteEvent, ipc_fileLoadErrorEvent } from "./ipc";
import { Methods as WorkerMethods, WorkerSpec } from "./worker";

const log = electronLog.scope("replays/workerInterface");

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

      // Set up the file load completion handlers in main.
      worker.getFileLoadCompleteObservable().subscribe((fileLoadComplete) => {
        ipc_fileLoadCompleteEvent.main!.trigger(fileLoadComplete).catch(console.warn);
      });
      worker.getFileLoadErrorObservable().subscribe((fileLoadError) => {
        ipc_fileLoadErrorEvent.main!.trigger(fileLoadError).catch(console.warn);
      });

      resolve(worker);
    })
    .catch((err) => {
      log.error(err);
      reject(err);
    });
});
