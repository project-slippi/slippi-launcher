import { dolphinManager } from "@dolphin/manager";
import { settingsManager } from "@settings/settingsManager";

import type { BroadcastWorker } from "./broadcast.worker.interface";
import { createBroadcastWorker } from "./broadcast.worker.interface";
import { ipc_refreshBroadcastList, ipc_startBroadcast, ipc_stopBroadcast, ipc_watchBroadcast } from "./ipc";
import type { SpectateWorker } from "./spectate.worker.interface";
import { createSpectateWorker } from "./spectate.worker.interface";

export default function installBroadcastIpc() {
  let spectateWorker: SpectateWorker | undefined;
  let broadcastWorker: BroadcastWorker | undefined;

  ipc_refreshBroadcastList.main!.handle(async ({ authToken }) => {
    if (!spectateWorker) {
      spectateWorker = await createSpectateWorker(dolphinManager);
    }
    await spectateWorker.refreshBroadcastList(authToken);
    return { success: true };
  });

  ipc_watchBroadcast.main!.handle(async ({ broadcasterId }) => {
    if (!spectateWorker) {
      throw new Error("Could not watch broadcast. Try refreshing the broadcast list and try again.");
    }
    const folderPath = settingsManager.get().settings.spectateSlpPath;
    await spectateWorker.startSpectate(broadcasterId, folderPath);
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
    if (!broadcastWorker) {
      throw new Error("Error stopping broadcast. Was the broadcast started to begin with?");
    }

    await broadcastWorker.stopBroadcast();

    return { success: true };
  });
}
