import type { WorkerSpec } from "@broadcast/spectate.worker";
import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import { ipc_remoteReconnectEvent } from "./ipc";

const log = electronLog.scope("remote.spectate.worker");

export type SpectateWorker = RegisteredWorker<WorkerSpec>;

export async function createSpectateWorker(dolphinManager: DolphinManager): Promise<SpectateWorker> {
  log.debug("spectate: Spawning remote worker");
  const worker = await registerWorker<WorkerSpec>(new Worker("../broadcast/spectate.worker"));

  worker.getLogObservable().subscribe((logMessage) => {
    log.info(logMessage);
  });
  worker.getErrorObservable().subscribe((err) => {
    log.error(err);
  });
  worker.getSpectateDetailsObservable().subscribe(({ playbackId, filePath, broadcasterName }) => {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      replay: filePath,
      gameStation: broadcasterName,
    };
    dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(log.error);
  });
  worker.getReconnectObservable().subscribe(() => {
    ipc_remoteReconnectEvent.main!.trigger({}).catch(log.error);
  });
  return worker;
}
