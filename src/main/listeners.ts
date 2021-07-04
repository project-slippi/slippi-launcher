import "@broadcast/main";
import "@dolphin/main";
import "@replays/main";
import "@settings/main";
import "@console/main";

import { settingsManager } from "@settings/settingsManager";
import { checkValidIso, fetchNewsFeed } from "common/ipc";
import { ipcMain, nativeImage } from "electron";
import path from "path";

import { fetchNewsFeedData } from "./newsFeed";
import { verifyIso } from "./verifyIso";

export function setupListeners() {
  ipcMain.on("onDragStart", (event, filePaths) => {
    const dragArguments: any = {
      files: filePaths,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    };

    event.sender.startDrag(dragArguments);
  });

  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  checkValidIso.main!.handle(async ({ path }) => {
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
}
