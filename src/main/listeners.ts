import { DolphinLaunchType, DolphinUseType } from "common/dolphin";
import { ipcMain, nativeImage } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import path from "path";

import { broadcastManager } from "./broadcastManager";
import { DolphinManager, ReplayCommunication } from "./dolphinManager";
import { assertDolphinInstallations } from "./downloadDolphin";
import { fetchNewsFeed } from "./newsFeed";
import { worker as replayBrowserWorker } from "./replayBrowser/workerInterface";

export function setupListeners() {
  ipcMain.on("onDragStart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("downloadDolphin", (_) => {
    assertDolphinInstallations();
  });

  ipcMain.on("startBroadcast", (_, viewerId: string, firebaseToken: string) => {
    broadcastManager.start(viewerId, firebaseToken);
  });

  ipcMain.on("stopBroadcast", () => {
    broadcastManager.stop();
  });

  setupDolphinManagerListeners();
}

function setupDolphinManagerListeners() {
  const dolphinManager = DolphinManager.getInstance();
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

  ipc.answerRenderer("loadReplayFolder", async (folderPath: string) => {
    const w = await replayBrowserWorker;
    w.getProgressObservable().subscribe((progress) => {
      ipc.sendToRenderers<{ current: number; total: number }>("loadReplayFolderProgress", progress);
    });
    const result = await w.loadReplayFolder(folderPath);
    return result;
  });

  ipc.answerRenderer("calculateGameStats", async (filePath: string) => {
    const w = await replayBrowserWorker;
    const result = await w.calculateGameStats(filePath);
    return result;
  });

  ipc.answerRenderer("fetchNewsFeed", async () => {
    const result = await fetchNewsFeed();
    return result;
  });
}
