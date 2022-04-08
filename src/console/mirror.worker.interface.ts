import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { ipc_consoleMirrorErrorMessageEvent, ipc_consoleMirrorStatusUpdatedEvent } from "./ipc";
import type { Methods as MirrorWorkerMethods, WorkerSpec as MirrorWorkerSpec } from "./mirror.worker";

const log = electronLog.scope("console/workerInterface");
const mirrorLog = electronLog.scope("mirrorManager");

export type MirrorWorker = {
  worker: Thread & MirrorWorkerMethods;
  terminate: () => Promise<void>;
};

export const createMirrorWorker = async (dolphinManager: DolphinManager): Promise<MirrorWorker> => {
  log.debug("mirror: Spawning worker");

  try {
    const worker = await spawn<MirrorWorkerSpec>(new Worker("./mirror.worker"), { timeout: 30000 });
    worker.getLogObservable().subscribe((logMessage) => {
      mirrorLog.info(logMessage);
    });

    worker.getErrorObservable().subscribe((errorMessage) => {
      mirrorLog.error(errorMessage);
      const message =
        errorMessage instanceof Error
          ? errorMessage.message
          : typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage);
      ipc_consoleMirrorErrorMessageEvent.main!.trigger({ message }).catch(mirrorLog.error);
    });

    worker.getMirrorDetailsObservable().subscribe(({ playbackId, filePath, isRealtime }) => {
      const replayComm: ReplayCommunication = {
        mode: "mirror",
        isRealTimeMode: isRealtime,
        replay: filePath,
      };
      dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(mirrorLog.error);
    });

    worker.getMirrorStatusObservable().subscribe((statusUpdate) => {
      ipc_consoleMirrorStatusUpdatedEvent.main!.trigger(statusUpdate).catch(mirrorLog.error);
    });

    dolphinManager.on("playback-dolphin-closed", (playbackId: string) => {
      worker.dolphinClosed(playbackId).catch(mirrorLog.error);
    });

    log.debug("mirror: Spawning worker: Done");

    const terminateWorker = async () => {
      log.debug("mirror: Terminating worker");
      try {
        await worker.dispose();
      } finally {
        await Thread.terminate(worker);
      }
    };

    app.on("quit", terminateWorker);
    return {
      worker,
      terminate: terminateWorker,
    };
  } catch (err) {
    log.error(err);
    throw err;
  }
};
