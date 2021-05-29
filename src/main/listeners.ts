import { settingsManager } from "@settings/settingsManager";
import { checkValidIso, fetchNewsFeed } from "common/ipc";
import { ipcMain, nativeImage } from "electron";
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

  fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  checkValidIso.main!.handle(async ({ path }) => {
    try {
      const result = await verifyIso(path);
      return { valid: result.valid };
    } catch (err) {
      return { valid: false };
    }
  });
}
