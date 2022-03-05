import AdmZip from "adm-zip";
import { spawnSync } from "child_process";
import { app, BrowserWindow } from "electron";
import { download } from "electron-dl";
import extractDmg from "extract-dmg";
import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { lt } from "semver";

import { fileExists } from "../main/fileExists";
import { fetchLatestDolphin } from "./checkVersion";
import { ipc_dolphinDownloadFinishedEvent, ipc_dolphinDownloadLogReceivedEvent } from "./ipc";
import type { DolphinVersionResponse } from "./types";
import { DolphinLaunchType } from "./types";
import { findDolphinExecutable } from "./util";

const isLinux = process.platform === "linux";

function logDownloadInfo(message: string): void {
  void ipc_dolphinDownloadLogReceivedEvent.main!.trigger({ message });
}

export async function assertDolphinInstallations(): Promise<void> {
  try {
    await assertDolphinInstallation(DolphinLaunchType.NETPLAY, logDownloadInfo);
    await assertDolphinInstallation(DolphinLaunchType.PLAYBACK, logDownloadInfo);
    await ipc_dolphinDownloadFinishedEvent.main!.trigger({ error: null });
  } catch (err: any) {
    console.error(err);
    await ipc_dolphinDownloadFinishedEvent.main!.trigger({ error: err.message });
  }
}

export async function assertDolphinInstallation(
  type: DolphinLaunchType,
  log: (message: string) => void,
): Promise<void> {
  try {
    await findDolphinExecutable(type);
    log(`Found existing ${type} Dolphin executable.`);
    log(`Checking if we need to update ${type} Dolphin`);
    const dolphinDownloadInfo = await fetchLatestDolphin(type);
    const latestVersion = dolphinDownloadInfo.version;
    const isOutdated = await compareDolphinVersion(type, latestVersion);
    if (isOutdated) {
      log(`${type} Dolphin installation is outdated. Downloading latest...`);
      await downloadAndInstallDolphin(type, dolphinDownloadInfo, log);
      return;
    }
    log("No update found...");
    return;
  } catch (err) {
    log(`Could not find ${type} Dolphin installation. Downloading...`);
    const dolphinDownloadInfo = await fetchLatestDolphin(type);
    await downloadAndInstallDolphin(type, dolphinDownloadInfo, log);
  }
}

async function compareDolphinVersion(type: DolphinLaunchType, latestVersion: string): Promise<boolean> {
  const dolphinPath = await findDolphinExecutable(type);
  const dolphinVersion = spawnSync(dolphinPath, ["--version"]).stdout.toString();
  return lt(dolphinVersion, latestVersion);
}

export async function downloadAndInstallDolphin(
  type: DolphinLaunchType,
  releaseInfo: DolphinVersionResponse,
  log: (message: string) => void,
  cleanInstall = false,
): Promise<void> {
  switch (process.platform) {
    case "win32":
    case "linux":
    case "darwin": {
      const downloadUrl = releaseInfo.downloadUrls[process.platform];
      const downloadedAsset = await downloadLatestDolphin(downloadUrl, log);
      log(`Installing v${releaseInfo.version} ${type} Dolphin...`);
      await installDolphin(type, downloadedAsset, log, cleanInstall);
      log(`Finished v${releaseInfo.version} ${type} Dolphin install`);
      break;
    }
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

async function downloadLatestDolphin(
  downloadUrl: string,
  log: (status: string) => void = console.log,
): Promise<string> {
  const parsedUrl = new URL(downloadUrl);
  const filename = path.basename(parsedUrl.pathname);

  const downloadDir = path.join(app.getPath("userData"), "temp");
  await fs.ensureDir(downloadDir);
  const downloadLocation = path.join(downloadDir, filename);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${downloadUrl} to ${downloadLocation}`);
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      await download(win, downloadUrl, {
        filename: filename,
        directory: downloadDir,
        onProgress: (progress) => log(`Downloading... ${(progress.percent * 100).toFixed(0)}%`),
      });
      log(`Successfully downloaded ${downloadUrl} to ${downloadLocation}`);
    } else {
      log("I dunno how we got here, but apparently there isn't a browser window /shrug");
    }
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}

async function installDolphin(
  type: DolphinLaunchType,
  assetPath: string,
  log: (message: string) => void,
  cleanInstall = false,
) {
  const dolphinPath = path.join(app.getPath("userData"), type);

  if (cleanInstall) {
    await fs.remove(dolphinPath);
    if (isLinux) {
      const userFolder = type === DolphinLaunchType.NETPLAY ? "SlippiOnline" : "SlippiPlayback";
      await fs.remove(path.join(app.getPath("home"), ".config", userFolder));
    }
  }

  switch (process.platform) {
    case "win32": {
      // don't need to backup user files since our zips don't contain them
      log(`Extracting to: ${dolphinPath}`);
      const zip = new AdmZip(assetPath);
      zip.extractAllTo(dolphinPath, true);
      break;
    }
    case "darwin": {
      await installDolphinOnMac(assetPath, dolphinPath, log);
      break;
    }
    case "linux": {
      await installDolphinOnLinux(type, assetPath, dolphinPath, log);
      break;
    }
    default: {
      throw new Error(`Installing Netplay is not supported on this platform: ${process.platform}`);
    }
  }
}

async function installDolphinOnMac(assetPath: string, dolphinPath: string, log: (message: string) => void) {
  const backupLocation = dolphinPath + "_old";
  const dolphinResourcesPath = path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources");

  const alreadyInstalled = await fs.pathExists(dolphinResourcesPath);
  if (alreadyInstalled) {
    log(`${dolphinResourcesPath} already exists. Moving...`);
    await fs.move(dolphinPath, backupLocation, { overwrite: true });
  }

  log(`Extracting to: ${dolphinPath}`);
  await extractDmg(assetPath, dolphinPath);
  const files = await fs.readdir(dolphinPath);
  await Promise.all(
    files
      .filter((file) => file !== "Slippi Dolphin.app")
      .map(async (file) => {
        await fs.remove(path.join(dolphinPath, file));
      }),
  );

  // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
  const binaryLocation = path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "MacOS", "Slippi Dolphin");
  const userInfo = os.userInfo();
  await fs.chmod(path.join(dolphinPath, "Slippi Dolphin.app"), "777");
  await fs.chown(path.join(dolphinPath, "Slippi Dolphin.app"), userInfo.uid, userInfo.gid);
  await fs.chmod(binaryLocation, "777");
  await fs.chown(binaryLocation, userInfo.uid, userInfo.gid);

  // move backed up User folder and user.json
  if (alreadyInstalled) {
    const oldUserFolder = path.join(backupLocation, "Slippi Dolphin.app", "Contents", "Resources", "User");
    const newUserFolder = path.join(dolphinResourcesPath, "User");
    log("moving User folder...");
    await fs.move(oldUserFolder, newUserFolder, { overwrite: true });
    await fs.remove(backupLocation);
  }
}

async function installDolphinOnLinux(
  type: DolphinLaunchType,
  assetPath: string,
  dolphinPath: string,
  log: (message: string) => void,
) {
  try {
    const dolphinAppImagePath = await findDolphinExecutable(type);
    log(`${dolphinAppImagePath} already exists. Deleting...`);
    await fs.remove(dolphinAppImagePath);
  } catch (err) {
    log("No existing AppImage found");
  }

  const zip = new AdmZip(assetPath);
  zip.extractAllTo(dolphinPath, true);

  // make the appimage executable because sometimes it doesn't have the right perms out the gate
  const dolphinAppImagePath = await findDolphinExecutable(type);
  log(`Setting executable permissions...`);
  await fs.chmod(dolphinAppImagePath, "755");
}
