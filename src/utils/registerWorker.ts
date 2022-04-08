import { app } from "electron";
import log from "electron-log";
import type { Worker } from "threads";
import { spawn, Thread } from "threads";
import type { ModuleMethods } from "threads/dist/types/master";

type WorkerMethods = { dispose: () => Promise<void> } & ModuleMethods;

export type RegisteredWorker<T> = Thread & T;

/**
 * Spawns and registers a worker to automatically terminate once the app is quit.
 */
export async function registerWorker<T extends WorkerMethods>(worker: Worker): Promise<RegisteredWorker<T>> {
  try {
    const registeredWorker = (await spawn(worker, { timeout: 30000 })) as Thread & T;
    const terminateWorker = async () => {
      try {
        await registeredWorker.dispose();
      } finally {
        await Thread.terminate(registeredWorker);
      }
    };

    app.on("quit", terminateWorker);

    return registeredWorker;
  } catch (err) {
    log.error(err);
    throw err;
  }
}
