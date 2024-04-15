import { Preconditions } from "@common/preconditions";
import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import type { SettingsManager } from "@settings/settings_manager";
import log from "electron-log";

import type { BroadcastWorker } from "./broadcast.worker.interface";
import { createBroadcastWorker } from "./broadcast.worker.interface";
import { ipc_refreshBroadcastList, ipc_startBroadcast, ipc_stopBroadcast, ipc_watchBroadcast } from "./ipc";
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

  ipc_refreshBroadcastList.main!.handle(async ({ authToken }) => {
    if (!spectateWorker) {
      spectateWorker = await createSpectateWorker(dolphinManager);
    }
    await spectateWorker.refreshBroadcastList(authToken);
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

    await broadcastWorker.stopBroadcast();

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
