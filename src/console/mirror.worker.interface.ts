import { dolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { ipc_consoleMirrorErrorMessageEvent, ipc_consoleMirrorStatusUpdatedEvent } from "./ipc";
import type { Methods as MirrorWorkerMethods, WorkerSpec as MirrorWorkerSpec } from "./mirror.worker";

const log = electronLog.scope("console/workerInterface");
const mirrorLog = electronLog.scope("mirrorManager");

export const mirrorWorker: Promise<Thread & MirrorWorkerMethods> = new Promise((resolve, reject) => {
  log.debug("mirror: Spawning worker");

  spawn<MirrorWorkerSpec>(new Worker("./mirror.worker"), { timeout: 30000 })
    .then((worker) => {
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

      async function terminateWorker() {
        log.debug("mirror: Terminating worker");
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
    .catch((err) => {
      log.error(err);
      reject(err);
    });
});
