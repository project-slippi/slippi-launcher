import { addGamePathToInis } from "@dolphin/util";
import path from "path";

import {
  addNewConnection,
  deleteConnection,
  editConnection,
  setIsoPath,
  setLaunchMeleeOnPlay,
  setNetplayDolphinPath,
  setPlaybackDolphinPath,
  setRootSlpPath,
  setSpectateSlpPath,
} from "./ipc";
import { settingsManager } from "./settingsManager";

// getAppSettings.main!.handle(async () => {
//   const settings = settingsManager.get();
//   return settings;
// });

setIsoPath.main!.handle(async ({ isoPath }) => {
  await settingsManager.setIsoPath(isoPath);
  if (isoPath) {
    const gameDir = path.dirname(isoPath);
    await addGamePathToInis(gameDir);
  }
  return { success: true };
});

setRootSlpPath.main!.handle(async ({ path }) => {
  await settingsManager.setRootSlpPath(path);
  return { success: true };
});

setSpectateSlpPath.main!.handle(async ({ path }) => {
  await settingsManager.setSpectateSlpPath(path);
  return { success: true };
});

setNetplayDolphinPath.main!.handle(async ({ path }) => {
  await settingsManager.setNetplayDolphinPath(path);
  return { success: true };
});

setPlaybackDolphinPath.main!.handle(async ({ path }) => {
  await settingsManager.setPlaybackDolphinPath(path);
  return { success: true };
});

addNewConnection.main!.handle(async ({ connection }) => {
  await settingsManager.addConsoleConnection(connection);
  return { success: true };
});

editConnection.main!.handle(async ({ id, connection }) => {
  await settingsManager.editConsoleConnection(id, connection);
  return { success: true };
});

deleteConnection.main!.handle(async ({ id }) => {
  await settingsManager.deleteConsoleConnection(id);
  return { success: true };
});

setLaunchMeleeOnPlay.main!.handle(async ({ launchMelee }) => {
  await settingsManager.setLaunchMeleeOnPlay(launchMelee);
  return { success: true };
});
