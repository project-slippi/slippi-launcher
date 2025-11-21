import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import { ipc_broadcastListUpdatedEvent, ipc_spectateErrorOccurredEvent, ipc_spectateReconnectEvent } from "./ipc";
import type { WorkerSpec as SpectateWorkerSpec } from "./spectate.worker";
import type { BroadcasterItem } from "./types";

const log = electronLog.scope("spectate.worker");

export type SpectateWorker = RegisteredWorker<SpectateWorkerSpec>;

export async function createSpectateWorker(dolphinManager: DolphinManager): Promise<SpectateWorker> {
  log.debug("spectate: Spawning worker");

  const worker = await registerWorker<SpectateWorkerSpec>(new Worker("./spectate.worker"));
  log.debug("spectate: Spawning worker: Done");

  worker.getBroadcastListObservable().subscribe((data: BroadcasterItem[]) => {
    ipc_broadcastListUpdatedEvent.main!.trigger({ items: data }).catch(log.error);
  });
  worker.getLogObservable().subscribe((logMessage) => {
    log.info(logMessage);
  });
  worker.getErrorObservable().subscribe((err) => {
    log.error(err);
    const errorMessage = err instanceof Error ? err.message : err;
    void ipc_spectateErrorOccurredEvent.main!.trigger({ errorMessage });
  });
  worker.getSpectateDetailsObservable().subscribe(({ dolphinId, filePath, broadcasterName }) => {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      replay: filePath,
      gameStation: broadcasterName,
    };
    dolphinManager.launchPlaybackDolphin(dolphinId, replayComm).catch(log.error);
  });
  worker.getReconnectObservable().subscribe(() => {
    ipc_spectateReconnectEvent.main!.trigger({}).catch(log.error);
  });
  return worker;
}
