import type { DolphinManager } from "@dolphin/manager";
import type { ReplayCommunication } from "@dolphin/types";
import { app } from "electron";
import electronLog from "electron-log";
import { spawn, Thread, Worker } from "threads";

import { ipc_broadcastErrorOccurredEvent, ipc_broadcastListUpdatedEvent, ipc_spectateReconnectEvent } from "./ipc";
import type { Methods as SpectateWorkerMethods, WorkerSpec as SpectateWorkerSpec } from "./spectate.worker";
import type { BroadcasterItem } from "./types";

const log = electronLog.scope("broadcast/spectate.worker.interface");
const spectateLog = electronLog.scope("spectateManager");

export type SpectateWorker = {
  worker: Thread & SpectateWorkerMethods;
  terminate: () => Promise<void>;
};

export const createSpectateWorker = async (dolphinManager: DolphinManager): Promise<SpectateWorker> => {
  log.debug("spectate: Spawning worker");

  try {
    const worker = await spawn<SpectateWorkerSpec>(new Worker("./spectate.worker"), { timeout: 30000 });
    worker.getBroadcastListObservable().subscribe((data: BroadcasterItem[]) => {
      ipc_broadcastListUpdatedEvent.main!.trigger({ items: data }).catch(spectateLog.error);
    });
    worker.getLogObservable().subscribe((logMessage) => {
      spectateLog.info(logMessage);
    });
    worker.getErrorObservable().subscribe((err) => {
      spectateLog.error(err);
      const errorMessage = err instanceof Error ? err.message : err;
      ipc_broadcastErrorOccurredEvent.main!.trigger({ errorMessage }).catch(spectateLog.error);
    });
    worker.getSpectateDetailsObservable().subscribe(({ playbackId, filePath }) => {
      const replayComm: ReplayCommunication = {
        mode: "mirror",
        replay: filePath,
      };
      dolphinManager.launchPlaybackDolphin(playbackId, replayComm).catch(spectateLog.error);
    });
    worker.getReconnectObservable().subscribe(() => {
      ipc_spectateReconnectEvent.main!.trigger({}).catch(spectateLog.error);
    });

    dolphinManager.on("playback-dolphin-closed", (playbackId: string) => {
      worker.dolphinClosed(playbackId).catch(spectateLog.error);
    });

    log.debug("spectate: Spawning worker: Done");

    const terminateWorker = async () => {
      log.debug("spectate: Terminating worker");
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
