import { settingsManager } from "@settings/settingsManager";

import { broadcastManager } from "./broadcastManager";
import { ipc_refreshBroadcastList, ipc_startBroadcast, ipc_stopBroadcast, ipc_watchBroadcast } from "./ipc";
import { spectateManager } from "./spectateManager";

ipc_refreshBroadcastList.main!.handle(async ({ authToken }) => {
  await spectateManager.connect(authToken);
  await spectateManager.refreshBroadcastList();
  return { success: true };
});

ipc_watchBroadcast.main!.handle(async ({ broadcasterId }) => {
  const folderPath = settingsManager.get().settings.spectateSlpPath;
  spectateManager.watchBroadcast(broadcasterId, folderPath, true);
  return { success: true };
});

ipc_startBroadcast.main!.handle(async (config) => {
  await broadcastManager.start(config);
  return { success: true };
});

ipc_stopBroadcast.main!.handle(async () => {
  broadcastManager.stop();
  return { success: true };
});
