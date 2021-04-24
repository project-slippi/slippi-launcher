import { DolphinLaunchType } from "common/dolphin";
import { StartBroadcastConfig } from "common/types";
import { ipcMain, nativeImage } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import path from "path";

import { broadcastManager } from "./broadcastManager";
import { dolphinManager, ReplayCommunication } from "./dolphin";
import { assertDolphinInstallations } from "./downloadDolphin";
import { fetchNewsFeed } from "./newsFeed";
import { worker as replayBrowserWorker } from "./replayBrowser/workerInterface";
import { SpectateManager } from "./spectateManager";

const spectateManager = new SpectateManager();

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

  ipcMain.on("startBroadcast", (_, config: StartBroadcastConfig) => {
    broadcastManager.start(config);
  });

  ipcMain.on("stopBroadcast", () => {
    broadcastManager.stop();
  });

  setupDolphinManagerListeners();
}

function setupDolphinManagerListeners() {
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

  ipcMain.on("configureDolphin", (_, dolphinType: DolphinLaunchType) => {
    dolphinManager.configureDolphin(dolphinType);
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

  ipc.answerRenderer("fetchBroadcastList", async (authToken: string) => {
    await spectateManager.connect(authToken);
    const result = await spectateManager.fetchBroadcastList();
    console.log("fetched broadcast list: ", result);
    return result;
  });

  ipc.answerRenderer("watchBroadcast", async (broadcasterId: string) => {
    spectateManager.watchBroadcast(broadcasterId);
  });
}
