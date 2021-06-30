import "@broadcast/main";
import "@dolphin/main";
import "@replays/main";
import "@settings/main";
import "@console/main";

import { DolphinLaunchType } from "@dolphin/types";
import { findDolphinExecutable } from "@dolphin/util";
import { settingsManager } from "@settings/settingsManager";
import { isLinux } from "common/constants";
import { ipc_checkValidIso, ipc_deleteDesktopAppPath, ipc_fetchNewsFeed, ipc_getDesktopAppPath } from "common/ipc";
import { IsoValidity } from "common/types";
import { app, ipcMain, nativeImage } from "electron";
import * as fs from "fs-extra";
import os from "os";
import osName from "os-name";
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

  ipcMain.on("getOsInfoSync", (event) => {
    const release = os.release();
    const name = osName(os.platform(), release);
    event.returnValue = `${name} (${release})`;
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
      return { path, valid: IsoValidity.INVALID };
    }

    try {
      const result = await verifyIso(path);
      return { path, valid: result };
    } catch (err) {
      return { path, valid: IsoValidity.INVALID };
    }
  });

  ipc_getDesktopAppPath.main!.handle(async () => {
    // get the path and check existence
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    let exists = await fs.pathExists(desktopAppPath);

    if (!exists) {
      return { dolphinPath: "", exists: false };
    }

    // Linux doesn't need to do anything because their dolphin settings are in a user config dir
    if (isLinux && exists) {
      await fs.remove(desktopAppPath);
      return { dolphinPath: "", exists: false };
    }

    const dolphinFolderPath = path.join(desktopAppPath, "dolphin");
    exists = await fs.pathExists(dolphinFolderPath);

    const dolphinExecutablePath = await findDolphinExecutable(DolphinLaunchType.NETPLAY, dolphinFolderPath);

    return { dolphinPath: dolphinExecutablePath, exists: exists };
  });

  ipc_deleteDesktopAppPath.main!.handle(async () => {
    // get the path and remove
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    await fs.remove(desktopAppPath);

    return { success: true };
  });
}
