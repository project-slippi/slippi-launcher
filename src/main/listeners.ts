import { ipcMain, nativeImage } from "electron";
import path from "path";
import { dolphinManager, ReplayCommunication } from "./dolphinManager";

export function setupListeners() {
  const dolphinMgr = dolphinManager.getInstance();
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
    dolphinMgr.launchDolphin("playback", -1, replayComm);
  });

  ipcMain.on("playnetplay", () => {
    dolphinMgr.launchDolphin("netplay", -1);
  });
}
