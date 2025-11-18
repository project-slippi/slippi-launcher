import type { DolphinManager } from "@dolphin/manager";
import { DolphinLaunchType } from "@dolphin/types";
import { ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";

import { ipc_addNewConnection, ipc_deleteConnection, ipc_editConnection, ipc_updateSettings } from "./ipc";
import type { SettingsManager } from "./settings_manager";

export default function setupSettingsIpc({
  settingsManager,
  dolphinManager,
}: {
  settingsManager: SettingsManager;
  dolphinManager: DolphinManager;
}) {
  // NEW: Subscribe to setting changes for side effects
  // This inverts the dependency - SettingsManager doesn't need to know about DolphinManager
  setupSettingsSubscriptions(settingsManager, dolphinManager);

  // Synchronous getter
  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  // Generic batch update
  ipc_updateSettings.main!.handle(async ({ updates }) => {
    await settingsManager.updateSettings(updates);
    return { success: true };
  });

  // Connection management (special handling for ID generation)
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
}

/**
 * Setup subscriptions to setting changes
 * Each module handles its own side effects by subscribing to relevant settings
 */
function setupSettingsSubscriptions(settingsManager: SettingsManager, dolphinManager: DolphinManager) {
  // Subscribe to ISO path changes
  // The callback receives properly typed values - no casting needed! ✓
  settingsManager.onSettingChange("isoPath", async (isoPath) => {
    if (isoPath) {
      // TypeScript knows isoPath is string | null here
      const gameDir = path.dirname(isoPath);
      const netplayInstall = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
      const playbackInstall = dolphinManager.getInstallation(DolphinLaunchType.PLAYBACK);
      await Promise.all([netplayInstall.addGamePath(gameDir), playbackInstall.addGamePath(gameDir)]);
    }
  });

  // Subscribe to rootSlpPath changes
  // TypeScript knows replayPath is string - no casting! ✓
  settingsManager.onSettingChange("rootSlpPath", async (replayPath) => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await installation.updateSettings({ replayPath });
  });

  // Subscribe to useMonthlySubfolders changes
  // TypeScript knows useMonthlySubfolders is boolean - no casting! ✓
  settingsManager.onSettingChange("useMonthlySubfolders", async (useMonthlySubfolders) => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await installation.updateSettings({ useMonthlySubfolders });
  });

  // Subscribe to enableJukebox changes
  // TypeScript knows enableJukebox is boolean - no casting! ✓
  settingsManager.onSettingChange("enableJukebox", async (enableJukebox) => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await installation.updateSettings({ enableJukebox });
  });

  // Subscribe to auto-update setting
  // TypeScript knows autoUpdateLauncher is boolean - no casting! ✓
  settingsManager.onSettingChange("autoUpdateLauncher", (autoUpdateLauncher) => {
    autoUpdater.autoInstallOnAppQuit = autoUpdateLauncher;
  });
}
