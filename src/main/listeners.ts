import { ipcMain, nativeImage } from "electron";
import path from "path";
import { DolphinManager, ReplayCommunication } from "./dolphinManager";

export function setupListeners() {
  const dolphinManager = DolphinManager.getInstance();
  ipcMain.on("ondragstart", (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("viewreplay", (_, filePath) => {
    const replayComm: ReplayCommunication = {
      mode: "normal",
      replay: filePath,
    };
    dolphinManager.launchDolphin("playback", -1, replayComm);
  });

  ipcMain.on("playnetplay", () => {
    dolphinManager.launchDolphin("netplay", -1);
  });
}
