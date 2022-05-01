import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/registerWorker";
import { registerWorker } from "utils/registerWorker";

import { ipc_consoleMirrorErrorMessageEvent, ipc_consoleMirrorStatusUpdatedEvent } from "./ipc";
import type { WorkerSpec as MirrorWorkerSpec } from "./mirror.worker";

const log = electronLog.scope("mirror.worker");

export type MirrorWorker = RegisteredWorker<MirrorWorkerSpec>;

export async function createMirrorWorker(dolphinManager: DolphinManager): Promise<MirrorWorker> {
  log.debug("mirror: Spawning worker");

  const worker = await registerWorker<MirrorWorkerSpec>(new Worker("./mirror.worker"));
  log.debug("mirror: Spawning worker: Done");

  worker.getLogObservable().subscribe((logMessage) => {
    log.info(logMessage);
  });

  worker.getErrorObservable().subscribe((errorMessage) => {
    log.error(errorMessage);
    const message =
      errorMessage instanceof Error
        ? errorMessage.message
        : typeof errorMessage === "string"
        ? errorMessage
        : JSON.stringify(errorMessage);
    ipc_consoleMirrorErrorMessageEvent.main!.trigger({ message }).catch(log.error);
  });

  worker.getMirrorDetailsObservable().subscribe(({ playbackId, filePath, isRealtime }) => {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      isRealTimeMode: isRealtime,
      replay: filePath,
    };
    dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(log.error);
  });

  worker.getMirrorStatusObservable().subscribe((statusUpdate) => {
    ipc_consoleMirrorStatusUpdatedEvent.main!.trigger(statusUpdate).catch(log.error);
  });

  return worker;
}
