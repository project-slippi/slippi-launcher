import { Preconditions } from "@common/preconditions";
import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import type { SettingsManager } from "@settings/settings_manager";
import log from "electron-log";

import type { BroadcastWorker } from "./broadcast.worker.interface";
import { createBroadcastWorker } from "./broadcast.worker.interface";
import {
  ipc_connectToSpectateServer,
  ipc_refreshBroadcastList,
  ipc_startBroadcast,
  ipc_stopBroadcast,
  ipc_watchBroadcast,
} from "./ipc";
import type { SpectateWorker } from "./spectate.worker.interface";
import { createSpectateWorker } from "./spectate.worker.interface";
import type { SpectateController } from "./types";

const MINUTE = 60 * 1000;
const SPECTATE_IDLE_TIMEOUT = 15 * MINUTE;

export default function setupBroadcastIpc({
  settingsManager,
  dolphinManager,
}: {
  settingsManager: SettingsManager;
  dolphinManager: DolphinManager;
}): {
  getSpectateController: () => Promise<SpectateController>;
} {
  let spectateWorker: SpectateWorker | undefined;
  let broadcastWorker: BroadcastWorker | undefined;
  let prefixOrdinal = 0;
  let spectateIdleTimer: NodeJS.Timeout | undefined;

  const disconnectFromSpectateServerIfInactive = async () => {
    if (spectateWorker) {
      const openBroadcasts = await spectateWorker.getOpenBroadcasts().catch(() => []);
      if (openBroadcasts.length === 0) {
        log.debug("Disconnecting and terminating worker due to idle timeout");
        await spectateWorker.disconnect();
        await spectateWorker.terminate();
        spectateWorker = undefined;
      }
    }
  };

  // Helper to start/reset the idle timeout (only when no active broadcasts)
  const resetSpectateIdleTimeout = async () => {
    // Clear any existing timer
    if (spectateIdleTimer) {
      clearTimeout(spectateIdleTimer);
      spectateIdleTimer = undefined;
    }

    // Only start timeout if worker exists and has no active broadcasts
    if (spectateWorker) {
      const openBroadcasts = await spectateWorker.getOpenBroadcasts().catch(() => []);
      if (openBroadcasts.length === 0) {
        log.debug("Starting spectate idle timeout");
        spectateIdleTimer = setTimeout(disconnectFromSpectateServerIfInactive, SPECTATE_IDLE_TIMEOUT);
      }
    }
  };

  // Helper to stop the idle timeout (when actively watching)
  const stopSpectateIdleTimeout = () => {
    if (spectateIdleTimer) {
      log.debug("Stopping spectate idle timeout (actively watching)");
      clearTimeout(spectateIdleTimer);
      spectateIdleTimer = undefined;
    }
  };

  const initSpectateWorker = async (): Promise<SpectateWorker> => {
    if (spectateWorker) {
      return spectateWorker;
    }

    // Don't set the global variable here, only create and set up the worker.
    // Rely on the caller to set the global variable if needed.
    const worker = await createSpectateWorker(dolphinManager);

    // Start the idle timeout when the number of open broadcasts becomes zero (i.e. no more active spectating sessions).
    const spectateListSub = worker.getSpectateListObservable().subscribe(async (openBroadcasts) => {
      // Check if there are any remaining open broadcasts
      if (openBroadcasts.length === 0) {
        // No more active spectating sessions - start idle timeout
        log.debug("No active spectate sessions remaining, starting idle timeout");
        await resetSpectateIdleTimeout();
      }
    });

    // Start the idle timeout when a dolphin is closed (i.e. no more active spectating sessions).
    const dolphinClosedSub = dolphinManager.events
      .filter<DolphinPlaybackClosedEvent>((event) => {
        return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
      })
      .subscribe((event) => {
        void worker.dolphinClosed(event.instanceId).catch(log.error);
      });

    worker.onCleanup(() => {
      spectateListSub.unsubscribe();
      dolphinClosedSub.unsubscribe();
    });

    return worker;
  };

  ipc_connectToSpectateServer.main!.handle(async ({ authToken }) => {
    if (!spectateWorker) {
      spectateWorker = await initSpectateWorker();
    }
    await spectateWorker.connect(authToken);

    // Reset idle timeout on connect
    await resetSpectateIdleTimeout();

    return { success: true };
  });

  ipc_refreshBroadcastList.main!.handle(async () => {
    Preconditions.checkExists(
      spectateWorker,
      "Could not refresh broadcast list, make sure spectateWorker is connected.",
    );

    await spectateWorker.refreshBroadcastList();

    // Reset idle timeout on refresh
    await resetSpectateIdleTimeout();

    return { success: true };
  });

  ipc_watchBroadcast.main!.handle(async ({ broadcasterId }) => {
    Preconditions.checkExists(
      spectateWorker,
      "Could not watch broadcast. Try refreshing the broadcast list and try again.",
    );

    const folderPath = settingsManager.get().settings.spectateSlpPath;
    await spectateWorker.startSpectate(broadcasterId, folderPath, { idPostfix: `broadcast${prefixOrdinal}` });
    prefixOrdinal += 1;

    // Stop idle timeout when actively watching a broadcast
    stopSpectateIdleTimeout();

    return { success: true };
  });

  ipc_startBroadcast.main!.handle(async (config) => {
    if (!broadcastWorker) {
      broadcastWorker = await createBroadcastWorker();
    }

    await broadcastWorker.startBroadcast(config);
    return { success: true };
  });

  ipc_stopBroadcast.main!.handle(async () => {
    Preconditions.checkExists(broadcastWorker, "Error stopping broadcast. Was the broadcast started to begin with?");

    // Stop the broadcast
    await broadcastWorker.stopBroadcast();

    // Terminate the worker and clean up resources
    log.debug("Terminating broadcast worker after stopping broadcast");
    await broadcastWorker.terminate();
    broadcastWorker = undefined;

    return { success: true };
  });

  const getSpectateController = async (): Promise<SpectateController> => {
    if (!spectateWorker) {
      spectateWorker = await initSpectateWorker();
    }
    return spectateWorker;
  };

  return {
    getSpectateController,
  };
}
