import { DolphinLaunchType, DolphinUseType } from "common/dolphin";
import { BrowserWindow, ipcMain, nativeImage } from "electron";
import path from "path";

import { DolphinManager, ReplayCommunication } from "./dolphinManager";
import { assertDolphinInstallations } from "./downloadDolphin";
import { worker } from "./fileIndexer/workerInterface";

export function setupListeners() {
  const dolphinManager = DolphinManager.getInstance();
  ipcMain.on("onDragStart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("downloadDolphin", (_) => {
    assertDolphinInstallations();
  });

  ipcMain.on("synchronous-message", async (_, arg) => {
    console.log(`calculating factorial for: ${arg}`);
    const w = await worker;
    const val = await w.fib(arg);
    console.log(`return ${val} as factorial result`);
    // event.returnValue = val;
    const x = BrowserWindow.getFocusedWindow();
    if (x) {
      x.webContents.send("synchronous-message-reply", val);
    }
  });

  ipcMain.on("viewReplay", (_, filePath: string) => {
    const replayComm: ReplayCommunication = {
      mode: "normal",
      replay: filePath,
    };
    dolphinManager.launchDolphin(DolphinUseType.PLAYBACK, -1, replayComm);
  });

  ipcMain.on("watchBroadcast", (_, filePath: string, mode: "normal" | "mirror", index: number) => {
    const replayComm: ReplayCommunication = {
      mode: mode,
      replay: filePath,
    };
    dolphinManager.launchDolphin(DolphinUseType.SPECTATE, index, replayComm);
  });

  ipcMain.on("playNetplay", () => {
    dolphinManager.launchDolphin(DolphinUseType.NETPLAY, -1);
  });

  ipcMain.on("configureDolphin", (_, dolphinType: DolphinLaunchType) => {
    dolphinManager.launchDolphin(DolphinUseType.CONFIG, -1, undefined, dolphinType);
  });
}
