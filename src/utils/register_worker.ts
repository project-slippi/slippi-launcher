import { app } from "electron";
import log from "electron-log";
import type { Worker } from "threads";
import { spawn, Thread } from "threads";
import type { ModuleMethods } from "threads/dist/types/master";

type WorkerMethods = { dispose: () => Promise<void> } & ModuleMethods;

export type RegisteredWorker<T> = Thread &
  T & {
    terminate: () => Promise<void>;
  };

/**
 * Spawns and registers a worker to automatically terminate once the app is quit.
 * The returned worker has a `terminate()` method for explicit cleanup.
 */
export async function registerWorker<T extends WorkerMethods>(worker: Worker): Promise<RegisteredWorker<T>> {
  try {
    const registeredWorker = (await spawn(worker, { timeout: 30000 })) as Thread & T;

    const terminateWorker = async () => {
      try {
        log.debug("Disposing worker...");
        await registeredWorker.dispose();
      } catch (err) {
        log.error("Error disposing worker:", err);
      }

      try {
        log.debug("Terminating worker thread...");
        await Thread.terminate(registeredWorker);
      } catch (err) {
        log.error("Error terminating worker thread:", err);
      }
    };

    // Register for app quit
    app.on("quit", terminateWorker);

    // Expose terminate method on the worker
    (registeredWorker as any).terminate = terminateWorker;

    return registeredWorker as RegisteredWorker<T>;
  } catch (err) {
    log.error(err);
    throw err;
  }
}
