import "@broadcast/main";
import "@dolphin/main";
import "@replays/main";
import "@settings/main";
import "@console/main";

import { settingsManager } from "@settings/settingsManager";
import { isDevelopment } from "common/constants";
import {
  ipc_checkForUpdate,
  ipc_checkValidIso,
  ipc_copyLogsToClipboard,
  ipc_deleteDesktopAppPath,
  ipc_fetchNewsFeed,
  ipc_getLatestGitHubReleaseVersion,
  ipc_installUpdate,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
} from "common/ipc";
import { IsoValidity } from "common/types";
import { app, clipboard, ipcMain, nativeImage } from "electron";
import electronLog from "electron-log";
import { autoUpdater, ProgressInfo, UpdateInfo } from "electron-updater";
import * as fs from "fs-extra";
import os from "os";
import osName from "os-name";
import path from "path";

import { fileExists } from "./fileExists";
import { getLatestRelease } from "./github";
import { fetchNewsFeedData } from "./newsFeed";
import { readLastLines } from "./util";
import { verifyIso } from "./verifyIso";

const log = electronLog.scope("main/listeners");

autoUpdater.logger = log;

const LINES_TO_READ = 200;

export function setupListeners() {
  ipcMain.on("onDragStart", (event, files: string[]) => {
    // The Electron.Item type declaration is missing the files attribute
    // so we'll just cast it as unknown for now.
    event.sender.startDrag(({
      files,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    } as unknown) as Electron.Item);
  });

  ipcMain.on("getOsInfoSync", (event) => {
    const release = os.release();
    try {
      const name = osName(os.platform(), release);
      event.returnValue = `${name} (${release})`;
    } catch (err) {
      log.error(err);
      event.returnValue = release;
    }
  });

  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  ipc_fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  ipc_checkValidIso.main!.handle(async ({ path }) => {
    // Make sure we have a valid path
    if (!path) {
      return { path, valid: IsoValidity.INVALID };
    }

    try {
      const result = await verifyIso(path);
      return { path, valid: result };
    } catch (err) {
      return { path, valid: IsoValidity.INVALID };
    }
  });

  ipc_deleteDesktopAppPath.main!.handle(async () => {
    // get the path and remove
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    await fs.remove(desktopAppPath);

    return { success: true };
  });

  ipc_copyLogsToClipboard.main!.handle(async () => {
    let logsFolder = "";
    if (isDevelopment) {
      logsFolder = path.join(app.getPath("appData"), "Slippi Launcher", "logs");
    } else {
      logsFolder = path.join(app.getPath("userData"), "logs");
    }
    const mainLogPath = path.join(logsFolder, "main.log");
    const rendererLogPath = path.join(logsFolder, "renderer.log");

    // Fetch log contents in parallel
    const [mainLogs, rendererLogs] = await Promise.all(
      [mainLogPath, rendererLogPath].map(
        async (logPath): Promise<string> => {
          if (await fileExists(logPath)) {
            return await readLastLines(logPath, LINES_TO_READ);
          }
          return "";
        },
      ),
    );

    clipboard.writeText(`MAIN START\n---------------\n${mainLogs}\n\nRENDERER START\n---------------\n${rendererLogs}`);
    return { success: true };
  });

  // check for updates
  autoUpdater.on("update-available", (info: UpdateInfo) => {
    ipc_launcherUpdateFoundEvent.main!.trigger({ version: info.version }).catch(log.warn);
  });

  autoUpdater.on("download-progress", async (progress: ProgressInfo) => {
    if (progress.total !== 0) {
      ipc_launcherUpdateDownloadingEvent
        .main!.trigger({
          progressPercent: progress.percent,
        })
        .catch(log.warn);
    }
  });

  autoUpdater.on("update-downloaded", () => {
    ipc_launcherUpdateReadyEvent.main!.trigger({}).catch(log.warn);
  });

  ipc_installUpdate.main!.handle(async () => {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });
  ipc_checkForUpdate.main!.handle(async () => {
    autoUpdater.checkForUpdates().catch(log.warn);
    return { success: true };
  });

  ipc_getLatestGitHubReleaseVersion.main!.handle(async ({ owner, repo }) => {
    const release = await getLatestRelease(owner, repo);
    const tag: string = release.tag_name;
    const version = tag.slice(1);
    return { version };
  });
}
