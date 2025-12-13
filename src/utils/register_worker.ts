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

const SECOND = 1000;
const WORKER_TIMEOUT = 30 * SECOND;

/**
 * Spawns and registers a worker to automatically terminate once the app is quit.
 * The returned worker has a `terminate()` method for explicit cleanup and
 * `onCleanup()` method to register cleanup callbacks.
 *
 * @param workerName - A unique identifier for the worker (used in logging)
 * @param worker - The worker instance to spawn and register
 */
export async function registerWorker<T extends WorkerMethods>(
  workerName: string,
  worker: Worker,
): Promise<RegisteredWorker<T>> {
  try {
    log.debug(`Spawning worker [${workerName}]...`);
    const registeredWorker = (await spawn(worker, { timeout: WORKER_TIMEOUT })) as Thread & T;
    const cleanupCallbacks: Array<() => void | Promise<void>> = [];
    let isTerminated = false;

    const terminateWorker = async () => {
      // Prevent double termination
      if (isTerminated) {
        return;
      }
      isTerminated = true;

      // Remove the quit listener to prevent it from being called again
      app.off("quit", terminateWorker);

      try {
        log.debug(`Disposing worker [${workerName}]...`);
        await registeredWorker.dispose();
      } catch (err) {
        log.error(`Error disposing worker [${workerName}]:`, err);
      }

      // Run cleanup callbacks after disposal
      for (const callback of cleanupCallbacks) {
        try {
          await callback();
        } catch (err) {
          log.error(`Error in cleanup callback for worker [${workerName}]:`, err);
        }
      }

      try {
        log.debug(`Terminating worker thread [${workerName}]...`);
        await Thread.terminate(registeredWorker);
      } catch (err) {
        log.error(`Error terminating worker thread [${workerName}]:`, err);
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

    log.debug(`Worker [${workerName}] spawned successfully`);
    return registeredWorker as RegisteredWorker<T>;
  } catch (err) {
    log.error(err);
    throw err;
  }
}
