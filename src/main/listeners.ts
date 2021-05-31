import { DolphinLaunchType } from "common/dolphin";
import { StartBroadcastConfig } from "common/types";
import { ipcMain, nativeImage } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import path from "path";

import { broadcastManager } from "./broadcastManager";
import { dolphinManager, ReplayCommunication } from "./dolphin";
import { assertDolphinInstallations } from "./downloadDolphin";
import { fetchNewsFeed } from "./newsFeed";
import { worker } from "./replayBrowser/dbWorkerInterface";
import { loadFolder } from "./replayBrowser/loadFolder";
// import { worker as replayBrowserWorker } from "./replayBrowser/workerInterface";
import { spectateManager } from "./spectateManager";

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
    return await loadFolder(folderPath, (current, total) =>
      ipc.sendToRenderers<{ current: number; total: number }>("loadReplayFolderProgress", { current, total }),
    );
  });

  ipc.answerRenderer("loadReplayFile", async (file: string) => {
    const w = await worker;
    return await w.getFullReplay(file);
  });

  // ipc.answerRenderer("loadPlayerReplays", async (player: string) => {
  //   const w = await worker
  //   return await w.getPlayerReplays(player);
  // });

  ipc.answerRenderer("pruneFolders", async (existingFolders: string[]) => {
    const w = await worker;
    return await w.pruneFolders(existingFolders);
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
    spectateManager.watchBroadcast(broadcasterId, undefined, true);
  });
}
