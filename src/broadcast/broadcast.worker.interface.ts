import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import type { Methods as BroadcastWorkerMethods, WorkerSpec as BroadcastWorkerSpec } from "./broadcast.worker";
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastReconnectEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
} from "./ipc";

const log = electronLog.scope("broadcast/broadcast.worker.interface");
const broadcastLog = electronLog.scope("broadcastManager");

export type BroadcastWorker = {
  worker: Thread & BroadcastWorkerMethods;
  terminate: () => Promise<void>;
};

export const createBroadcastWorker = async (): Promise<BroadcastWorker> => {
  log.debug("broadcast: Spawning worker");

  try {
    const worker = await spawn<BroadcastWorkerSpec>(new Worker("./broadcast.worker"), { timeout: 30000 });
    worker.getDolphinStatusObservable().subscribe(({ status }) => {
      ipc_dolphinStatusChangedEvent.main!.trigger({ status }).catch(broadcastLog.error);
    });
    worker.getSlippiStatusObservable().subscribe(({ status }) => {
      ipc_slippiStatusChangedEvent.main!.trigger({ status }).catch(broadcastLog.error);
    });
    worker.getLogObservable().subscribe((logMessage) => {
      broadcastLog.info(logMessage);
    });
    worker.getErrorObservable().subscribe((err) => {
      broadcastLog.error(err);
      const errorMessage = err instanceof Error ? err.message : err;
      ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(broadcastLog.error);
    });
    worker.getReconnectObservable().subscribe(({ config }) => {
      ipc_broadcastReconnectEvent.main!.trigger({ config }).catch(broadcastLog.error);
    });

    log.debug("broadcast: Spawning worker: Done");

    const terminateWorker = async () => {
      log.debug("broadcast: Terminating worker");
      try {
        await worker.dispose();
      } finally {
        await Thread.terminate(worker);
      }
    };

    app.on("quit", terminateWorker);

    // Thread.events(worker).subscribe((evt) => {
    //   log.debug("replayBrowser: Worker event:", evt);
    //   // TODO: Respawn on worker exit?
    // });

    return {
      worker,
      terminate: terminateWorker,
    };
  } catch (err) {
    log.error(err);
    throw err;
  }
};
