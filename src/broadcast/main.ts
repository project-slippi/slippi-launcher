import { settingsManager } from "@settings/settingsManager";
import { Thread } from "threads";

import { Methods as BroadcastWorkerMethods } from "./broadcastWorker";
import { ipc_refreshBroadcastList, ipc_startBroadcast, ipc_stopBroadcast, ipc_watchBroadcast } from "./ipc";
import { spectateManager } from "./spectateManager";
import { broadcastWorker } from "./workerInterfaces";

let bWorker: Thread & BroadcastWorkerMethods;

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
  bWorker = await broadcastWorker;
  await bWorker.startBroadcast(config);
  return { success: true };
});

ipc_stopBroadcast.main!.handle(async () => {
  await bWorker!.stopBroadcast();
  return { success: true };
});
