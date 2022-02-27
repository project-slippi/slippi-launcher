import { settingsManager } from "@settings/settingsManager";

import { ipc_refreshBroadcastList, ipc_startBroadcast, ipc_stopBroadcast, ipc_watchBroadcast } from "./ipc";
import { broadcastWorker } from "./broadcast.worker.interface";
import { spectateWorker } from "./spectate.worker.interface";

export default function installBroadcastIpc() {
  ipc_refreshBroadcastList.main!.handle(async ({ authToken }) => {
    const sWorker = await spectateWorker;
    await sWorker.refreshBroadcastList(authToken);
    return { success: true };
  });

  ipc_watchBroadcast.main!.handle(async ({ broadcasterId }) => {
    const sWorker = await spectateWorker;
    const folderPath = settingsManager.get().settings.spectateSlpPath;
    await sWorker.startSpectate(broadcasterId, folderPath);
    return { success: true };
  });

  ipc_startBroadcast.main!.handle(async (config) => {
    const bWorker = await broadcastWorker;
    await bWorker.startBroadcast(config);
    return { success: true };
  });

  ipc_stopBroadcast.main!.handle(async () => {
    const bWorker = await broadcastWorker;
    await bWorker.stopBroadcast();
    return { success: true };
  });
}
