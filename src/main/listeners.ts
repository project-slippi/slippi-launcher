import { DolphinType } from "common/dolphin";
import { ipcMain, nativeImage } from "electron";
import path from "path";
import { DolphinManager, ReplayCommunication } from "./dolphinManager";

export function setupListeners() {
  const dolphinManager = DolphinManager.getInstance();
  ipcMain.on("ondragstart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("viewreplay", (_, filePath: string) => {
    const replayComm: ReplayCommunication = {
      mode: "normal",
      replay: filePath,
    };
    dolphinManager.launchDolphin("playback", -1, replayComm);
  });

  ipcMain.on("watchbroadcast", (_, filePath: string, mode: "normal" | "mirror", index: number) => {
    const replayComm: ReplayCommunication = {
      mode: mode,
      replay: filePath,
    };
    dolphinManager.launchDolphin("spectate", index, replayComm);
  });

  ipcMain.on("playnetplay", () => {
    dolphinManager.launchDolphin("netplay", -1);
  });

  ipcMain.on("configuredolphin", (_, dolphinType: DolphinType) => {
    dolphinManager.launchDolphin("config", -1, undefined, dolphinType);
  });
}
