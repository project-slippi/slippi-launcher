import "@broadcast/main";
import "@dolphin/main";
import "@replays/main";
import "@settings/main";
import "@console/main";

import { dolphinManager } from "@dolphin/manager";
import { DolphinLaunchType } from "@dolphin/types";
import { settingsManager } from "@settings/settingsManager";
import { isLinux } from "common/constants";
import { ipc_checkValidIso, ipc_fetchNewsFeed, ipc_getDesktopAppPath, ipc_migrateDolphin } from "common/ipc";
import { app, ipcMain, nativeImage } from "electron";
import * as fs from "fs-extra";
import path from "path";

import { fetchNewsFeedData } from "./newsFeed";
import { verifyIso } from "./verifyIso";

export function setupListeners() {
  ipcMain.on("onDragStart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  ipc_fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  ipc_checkValidIso.main!.handle(async ({ path }) => {
    // Make sure we have a valid path
    if (!path) {
      return { path, valid: false };
    }

    try {
      const result = await verifyIso(path);
      return { path, valid: result.valid };
    } catch (err) {
      return { path, valid: false };
    }
  });

  ipc_getDesktopAppPath.main!.handle(async () => {
    // get the path and check existence
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    const exists = await fs.pathExists(desktopAppPath);

    if (isLinux && exists) {
      await fs.remove(desktopAppPath);
      return { exists: false };
    }

    return { exists: exists };
  });

  ipc_migrateDolphin.main!.handle(async ({ migrateNetplay, migratePlayback }) => {
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");

    if (migrateNetplay) {
      const baseNetplayPath = path.dirname(migrateNetplay);
      await dolphinManager.copyDolphinConfig(DolphinLaunchType.NETPLAY, baseNetplayPath);
    }
    if (migratePlayback) {
      const oldPlaybackDolphinPath = path.join(desktopAppPath, "dolphin");
      await dolphinManager.copyDolphinConfig(DolphinLaunchType.PLAYBACK, oldPlaybackDolphinPath);
    }
    if (desktopAppPath) {
      await fs.remove(desktopAppPath);
    }
    return { success: true };
  });
}
