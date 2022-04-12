import type { DolphinManager } from "@dolphin/manager";
import { DolphinLaunchType } from "@dolphin/types";
import { ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";

import {
  ipc_addNewConnection,
  ipc_deleteConnection,
  ipc_editConnection,
  ipc_setAutoUpdateLauncher,
  ipc_setExtraSlpPaths,
  ipc_setIsoPath,
  ipc_setLaunchMeleeOnPlay,
  ipc_setNetplayDolphinPath,
  ipc_setPlaybackDolphinPath,
  ipc_setRootSlpPath,
  ipc_setSpectateSlpPath,
  ipc_setUseMonthlySubfolders,
} from "./ipc";
import type { SettingsManager } from "./settingsManager";

export default function setupSettingsIpc({
  settingsManager,
  dolphinManager,
}: {
  settingsManager: SettingsManager;
  dolphinManager: DolphinManager;
}) {
  // getAppSettings.main!.handle(async () => {
  //   const settings = settingsManager.get();
  //   return settings;
  // });

  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  ipc_setIsoPath.main!.handle(async ({ isoPath }) => {
    await settingsManager.setIsoPath(isoPath);
    if (isoPath) {
      const gameDir = path.dirname(isoPath);
      const netplayInstall = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
      const playbackInstall = dolphinManager.getInstallation(DolphinLaunchType.PLAYBACK);
      await Promise.all([netplayInstall.addGamePath(gameDir), playbackInstall.addGamePath(gameDir)]);
    }
    return { success: true };
  });

  ipc_setRootSlpPath.main!.handle(async ({ path }) => {
    await settingsManager.setRootSlpPath(path);
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await installation.updateSettings({ replayPath: path });
    return { success: true };
  });

  ipc_setUseMonthlySubfolders.main!.handle(async ({ toggle }) => {
    await settingsManager.setUseMonthlySubfolders(toggle);
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await installation.updateSettings({ useMonthlySubfolders: toggle });
    return { success: true };
  });

  ipc_setSpectateSlpPath.main!.handle(async ({ path }) => {
    await settingsManager.setSpectateSlpPath(path);
    return { success: true };
  });

  ipc_setExtraSlpPaths.main!.handle(async ({ paths }) => {
    await settingsManager.setExtraSlpPaths(paths);
    return { success: true };
  });

  ipc_setNetplayDolphinPath.main!.handle(async ({ path }) => {
    await settingsManager.setNetplayDolphinPath(path);
    return { success: true };
  });

  ipc_setPlaybackDolphinPath.main!.handle(async ({ path }) => {
    await settingsManager.setPlaybackDolphinPath(path);
    return { success: true };
  });

  ipc_addNewConnection.main!.handle(async ({ connection }) => {
    await settingsManager.addConsoleConnection(connection);
    return { success: true };
  });

  ipc_editConnection.main!.handle(async ({ id, connection }) => {
    await settingsManager.editConsoleConnection(id, connection);
    return { success: true };
  });

  ipc_deleteConnection.main!.handle(async ({ id }) => {
    await settingsManager.deleteConsoleConnection(id);
    return { success: true };
  });

  ipc_setLaunchMeleeOnPlay.main!.handle(async ({ launchMelee }) => {
    await settingsManager.setLaunchMeleeOnPlay(launchMelee);
    return { success: true };
  });

  ipc_setAutoUpdateLauncher.main!.handle(async ({ autoUpdateLauncher }) => {
    await settingsManager.setAutoUpdateLauncher(autoUpdateLauncher);
    autoUpdater.autoInstallOnAppQuit = autoUpdateLauncher;
    return { success: true };
  });
}
