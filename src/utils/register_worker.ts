import { app } from "electron";
import log from "electron-log";
import type { Worker } from "threads";
import { spawn, Thread } from "threads";
import type { ModuleMethods } from "threads/dist/types/master";

type WorkerMethods = { dispose: () => Promise<void> } & ModuleMethods;

export type RegisteredWorker<T> = Thread &
  T & {
    terminate: () => Promise<void>;
    onCleanup: (callback: () => void | Promise<void>) => void;
  };

/**
 * Spawns and registers a worker to automatically terminate once the app is quit.
 * The returned worker has a `terminate()` method for explicit cleanup and
 * `onCleanup()` method to register cleanup callbacks.
 */
export async function registerWorker<T extends WorkerMethods>(worker: Worker): Promise<RegisteredWorker<T>> {
  try {
    const registeredWorker = (await spawn(worker, { timeout: 30000 })) as Thread & T;
    const cleanupCallbacks: Array<() => void | Promise<void>> = [];

    const terminateWorker = async () => {
      try {
        log.debug("Disposing worker...");
        await registeredWorker.dispose();
      } catch (err) {
        log.error("Error disposing worker:", err);
      }

      // Run cleanup callbacks after disposal
      for (const callback of cleanupCallbacks) {
        try {
          await callback();
        } catch (err) {
          log.error("Error in cleanup callback:", err);
        }
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

    // Expose onCleanup method to register cleanup callbacks
    (registeredWorker as any).onCleanup = (callback: () => void | Promise<void>) => {
      cleanupCallbacks.push(callback);
    };

    return registeredWorker as RegisteredWorker<T>;
  } catch (err) {
    log.error(err);
    throw err;
  }
}
