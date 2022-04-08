import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/registerWorker";
import { registerWorker } from "utils/registerWorker";

import type { WorkerSpec as BroadcastWorkerSpec } from "./broadcast.worker";
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastReconnectEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
} from "./ipc";

const log = electronLog.scope("broadcast.worker");

export type BroadcastWorker = RegisteredWorker<BroadcastWorkerSpec>;

export async function createBroadcastWorker(): Promise<BroadcastWorker> {
  log.debug("broadcast: Spawning worker");

  const worker = await registerWorker<BroadcastWorkerSpec>(new Worker("./broadcast.worker"));
  log.debug("broadcast: Spawning worker: Done");

  worker.getDolphinStatusObservable().subscribe(({ status }) => {
    ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(log.error);
  });
  worker.getSlippiStatusObservable().subscribe(({ status }) => {
    ipc_slippiStatusChangedEvent.main!.trigger({ status }).catch(log.error);
  });
  worker.getLogObservable().subscribe((logMessage) => {
    log.info(logMessage);
  });
  worker.getErrorObservable().subscribe((err) => {
    log.error(err);
    const errorMessage = err instanceof Error ? err.message : err;
    ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(log.error);
  });
  worker.getReconnectObservable().subscribe(({ config }) => {
    ipc_broadcastReconnectEvent.main!.trigger({ config }).catch(log.error);
  });
  return worker;
}
