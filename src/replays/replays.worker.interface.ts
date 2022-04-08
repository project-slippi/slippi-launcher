import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import type { Methods as WorkerMethods, WorkerSpec } from "./replays.worker";

const log = electronLog.scope("replays/workerInterface");

export type ReplayWorker = {
  worker: Thread & WorkerMethods;
  terminate: () => Promise<void>;
};

export const createReplayWorker = async (): Promise<ReplayWorker> => {
  log.debug("replayBrowser: Spawning worker");

  try {
    const worker = await spawn<WorkerSpec>(new Worker("./replays.worker"), { timeout: 30000 });
    log.debug("replayBrowser: Spawning worker: Done");

    const terminateWorker = async () => {
      log.debug("replayBrowser: Terminating worker");
      try {
        await worker.dispose();
      } finally {
        await Thread.terminate(worker);
      }
    };

    app.on("quit", terminateWorker);

    // Thread.events(worker).subscribe((evt) => {
    //   log.debug("replayBrowser: Worker event:", evt);
    //   // TODO: Respawn on worker exit?
    // });

    return {
      worker,
      terminate: terminateWorker,
    };
  } catch (err) {
    log.error(err);
    throw err;
  }
};
