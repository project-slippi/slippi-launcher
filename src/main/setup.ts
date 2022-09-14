import { IsoValidity } from "@common/types";
import { app, clipboard, dialog, ipcMain, nativeImage, shell } from "electron";
import electronLog from "electron-log";
import type { ProgressInfo, UpdateInfo } from "electron-updater";
import { autoUpdater } from "electron-updater";
import * as fs from "fs-extra";
import os from "os";
import osName from "os-name";
import path from "path";
import { fileExists } from "utils/fileExists";

import { getLatestRelease } from "./github";
import {
  ipc_checkForUpdate,
  ipc_checkValidIso,
  ipc_clearTempFolder,
  ipc_copyLogsToClipboard,
  ipc_deleteDesktopAppPath,
  ipc_deleteFiles,
  ipc_fetchNewsFeed,
  ipc_getLatestGitHubReleaseVersion,
  ipc_installUpdate,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
  ipc_showOpenDialog,
} from "./ipc";
import { fetchNewsFeedData } from "./newsFeed";
import { getAssetPath, readLastLines } from "./util";
import { verifyIso } from "./verifyIso";

const log = electronLog.scope("main/listeners");
const isDevelopment = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

autoUpdater.logger = log;

const LINES_TO_READ = 200;

export default function setupMainIpc() {
  ipcMain.on("onDragStart", (event, files: string[]) => {
    // The Electron.Item type declaration is missing the files attribute
    // so we'll just cast it as unknown for now.
    event.sender.startDrag({
      files,
      icon: nativeImage.createFromPath(getAssetPath("include", "file.png")),
    } as unknown as Electron.Item);
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

  ipc_fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  ipc_deleteFiles.main!.handle(async ({ filePaths }) => {
    const promises = await Promise.allSettled(filePaths.map((filePath) => shell.trashItem(filePath)));
    const errCount = promises.reduce((curr, { status }) => (status === "rejected" ? curr + 1 : curr), 0);
    if (errCount > 0) {
      throw new Error(`${errCount} file(s) failed to delete`);
    }
    return { success: true };
  });

  ipc_checkValidIso.main!.handle(async ({ path }) => {
    // Make sure we have a valid path
    if (!path) {
      return { path, valid: IsoValidity.UNVALIDATED };
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
    let logsFolder = isMac ? app.getPath("logs") : path.resolve(app.getPath("userData"), "logs");
    if (isDevelopment) {
      if (isMac) {
        logsFolder = path.join(logsFolder, "..", "Slippi Launcher");
      } else {
        logsFolder = path.join(logsFolder, "../../", "Slippi Launcher", "logs");
      }
    }

    const mainLogPath = path.join(logsFolder, "main.log");
    const rendererLogPath = path.join(logsFolder, "renderer.log");

    // Fetch log contents in parallel
    const [mainLogs, rendererLogs] = await Promise.all(
      [mainLogPath, rendererLogPath].map(async (logPath): Promise<string> => {
        if (await fileExists(logPath)) {
          return await readLastLines(logPath, LINES_TO_READ);
        }
        return "";
      }),
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
    autoUpdater.checkForUpdatesAndNotify().catch(log.error);
    return { success: true };
  });

  ipc_getLatestGitHubReleaseVersion.main!.handle(async ({ owner, repo }) => {
    const release = await getLatestRelease(owner, repo);
    const tag: string = release.tag_name;
    const version = tag.slice(1);
    return { version };
  });

  ipc_clearTempFolder.main!.handle(async () => {
    const tmpDir = path.join(app.getPath("userData"), "temp");
    try {
      await fs.remove(tmpDir);
      await fs.ensureDir(tmpDir);
    } catch (err) {
      log.error(err);
      throw err;
    }
    return { success: true };
  });

  ipc_showOpenDialog.main!.handle(async (options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    return { canceled, filePaths };
  });
}
