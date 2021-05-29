import { fetchNewsFeed } from "common/ipc";
import { ipcMain, nativeImage } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import path from "path";

import { dolphinManager, ReplayCommunication } from "../dolphin";
import { fetchNewsFeedData } from "./newsFeed";
import { worker as replayBrowserWorker } from "./replayBrowser/workerInterface";

export function setupListeners() {
  ipcMain.on("onDragStart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("viewReplay", (_, filePath: string) => {
    const replayComm: ReplayCommunication = {
      mode: "normal",
      replay: filePath,
    };
    dolphinManager.launchPlaybackDolphin("playback", replayComm);
  });

  ipcMain.on("playNetplay", () => {
    dolphinManager.launchNetplayDolphin();
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

  fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });
}
