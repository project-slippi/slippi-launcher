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

  dolphinManager.events
    .filter<DolphinPlaybackClosedEvent>((event) => {
      return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
    })
    .subscribe((event) => {
      if (spectateWorker) {
        void spectateWorker.dolphinClosed(event.instanceId).catch(log.error);
      }
    });

  ipc_connectToSpectateServer.main!.handle(async ({ authToken }) => {
    if (!spectateWorker) {
      spectateWorker = await createSpectateWorker(dolphinManager);
    }
    await spectateWorker.connect(authToken);
    return { success: true };
  });

  ipc_refreshBroadcastList.main!.handle(async () => {
    Preconditions.checkExists(
      spectateWorker,
      "Could not refresh broadcast list, make sure spectateWorker is connected.",
    );

    await spectateWorker.refreshBroadcastList();
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
      spectateWorker = await createSpectateWorker(dolphinManager);
    }
    return spectateWorker;
  };

  return {
    getSpectateController,
  };
}
