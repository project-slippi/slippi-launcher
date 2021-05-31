import { setIsoPath, setNetplayDolphinPath, setPlaybackDolphinPath, setRootSlpPath, setSpectateSlpPath } from "./ipc";
import { settingsManager } from "./settingsManager";

// getAppSettings.main!.handle(async () => {
//   const settings = settingsManager.get();
//   return settings;
// });

setIsoPath.main!.handle(async ({ path }) => {
  await settingsManager.setIsoPath(path);
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
