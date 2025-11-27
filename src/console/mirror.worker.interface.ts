import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import electronLog from "electron-log";
import type { Subscription } from "observable-fns";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import { ipc_consoleMirrorErrorMessageEvent, ipc_consoleMirrorStatusUpdatedEvent } from "./ipc";
import type { WorkerSpec as MirrorWorkerSpec } from "./mirror.worker";

const log = electronLog.scope("mirror.worker");

export type MirrorWorker = RegisteredWorker<MirrorWorkerSpec>;

export async function createMirrorWorker(dolphinManager: DolphinManager): Promise<MirrorWorker> {
  log.debug("mirror: Spawning worker");

  const worker = await registerWorker<MirrorWorkerSpec>(new Worker("./mirror.worker"));
  log.debug("mirror: Spawning worker: Done");

  // Store subscriptions for cleanup
  const subscriptions: Subscription<any>[] = [];

  subscriptions.push(
    worker.getLogObservable().subscribe((logMessage) => {
      log.info(logMessage);
    }),
  );

  subscriptions.push(
    worker.getErrorObservable().subscribe((errorMessage) => {
      log.error(errorMessage);
      const message =
        errorMessage instanceof Error
          ? errorMessage.message
          : typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage);
      ipc_consoleMirrorErrorMessageEvent.main!.trigger({ message }).catch(log.error);
    }),
  );

  subscriptions.push(
    worker.getMirrorDetailsObservable().subscribe(({ playbackId, filePath, isRealtime, nickname }) => {
      const replayComm: ReplayCommunication = {
        mode: "mirror",
        isRealTimeMode: isRealtime,
        replay: filePath,
        gameStation: nickname,
      };
      dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(log.error);
    }),
  );

  subscriptions.push(
    worker.getMirrorStatusObservable().subscribe((statusUpdate) => {
      ipc_consoleMirrorStatusUpdatedEvent.main!.trigger(statusUpdate).catch(log.error);
    }),
  );

  // Wrap dispose to clean up subscriptions
  const originalDispose = worker.dispose.bind(worker);
  worker.dispose = async () => {
    // Call originalDispose() FIRST to complete cleanup
    await originalDispose();

    // Then unsubscribe from observables
    log.debug("mirror: Unsubscribing from worker observables");
    subscriptions.forEach((sub) => sub.unsubscribe());
  };

  return worker;
}
