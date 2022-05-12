import { ipc_fileLoadCompleteEvent, ipc_fileLoadErrorEvent } from "@replays/ipc";
import type { FileLoadComplete, FileLoadError } from "@replays/types";
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

    // Set up the file load completion handlers in main.
    registeredWorker.getFileLoadCompleteObservable().subscribe((fileLoadComplete: FileLoadComplete) => {
      ipc_fileLoadCompleteEvent.main!.trigger(fileLoadComplete).catch(console.warn);
    });
    registeredWorker.getFileLoadErrorObservable().subscribe((fileLoadError: FileLoadError) => {
      ipc_fileLoadErrorEvent.main!.trigger(fileLoadError).catch(console.warn);
    });

    return registeredWorker;
  } catch (err) {
    log.error(err);
    throw err;
  }
}
