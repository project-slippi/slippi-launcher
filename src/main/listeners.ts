import { DolphinLaunchType } from "common/dolphin";
import { fetchNewsFeed } from "common/ipc";
import { ipcMain, nativeImage } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import path from "path";

import { dolphinManager, ReplayCommunication } from "./dolphin";
import { assertDolphinInstallations } from "./downloadDolphin";
import { fetchNewsFeedData } from "./newsFeed";
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

  ipc.answerRenderer("configureDolphin", async (dolphinType: DolphinLaunchType) => {
    console.log("configuring dolphin...");
    await dolphinManager.configureDolphin(dolphinType);
  });

  ipc.answerRenderer("reinstallDolphin", async (dolphinType: DolphinLaunchType) => {
    console.log("reinstalling dolphin...");
    await dolphinManager.reinstallDolphin(dolphinType);
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
