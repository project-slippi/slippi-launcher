import { settingsManager } from "@settings/settingsManager";

import { broadcastManager } from "./broadcastManager";
import { fetchBroadcastList, startBroadcast, stopBroadcast, watchBroadcast } from "./ipc";
import { spectateManager } from "./spectateManager";

fetchBroadcastList.main!.handle(async ({ authToken }) => {
  await spectateManager.connect(authToken);
  const result = await spectateManager.fetchBroadcastList();
  console.log("fetched broadcast list: ", result);
  return { items: result };
});

watchBroadcast.main!.handle(async ({ broadcasterId }) => {
  const folderPath = settingsManager.get().settings.spectateSlpPath;
  spectateManager.watchBroadcast(broadcasterId, folderPath, true);
  return { success: true };
});

startBroadcast.main!.handle(async (config) => {
  await broadcastManager.start(config);
  return { success: true };
});

stopBroadcast.main!.handle(async () => {
  broadcastManager.stop();
  return { success: true };
});
