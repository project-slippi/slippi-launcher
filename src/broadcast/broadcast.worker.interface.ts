import electronLog from "electron-log";
import type { Subscription } from "observable-fns";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

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

  // Store subscriptions for cleanup
  const subscriptions: Subscription<unknown>[] = [];

  subscriptions.push(
    worker.getDolphinStatusObservable().subscribe(({ status }) => {
      ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(log.error);
    }),
  );

  subscriptions.push(
    worker.getSlippiStatusObservable().subscribe(({ status }) => {
      ipc_slippiStatusChangedEvent.main!.trigger({ status }).catch(log.error);
    }),
  );

  subscriptions.push(
    worker.getLogObservable().subscribe((logMessage) => {
      log.info(logMessage);
    }),
  );

  subscriptions.push(
    worker.getErrorObservable().subscribe((err) => {
      log.error(err);
      const errorMessage = err instanceof Error ? err.message : err;
      ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(log.error);
    }),
  );

  subscriptions.push(
    worker.getReconnectObservable().subscribe(({ config }) => {
      ipc_broadcastReconnectEvent.main!.trigger({ config }).catch(log.error);
    }),
  );

  // Register cleanup callback to unsubscribe after worker disposal
  worker.onCleanup(() => {
    log.debug("broadcast: Unsubscribing from worker observables");
    subscriptions.forEach((sub) => sub.unsubscribe());
  });

  return worker;
}
