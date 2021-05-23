import AdmZip from "adm-zip";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "child_process";
import { DolphinLaunchType, findDolphinExecutable } from "common/dolphin";
import { fileExists } from "common/utils";
import { app, BrowserWindow } from "electron";
import { download } from "electron-dl";
import * as fs from "fs-extra";
import path from "path";
import { lt } from "semver";

import { getLatestRelease } from "./github";

export function sendToRenderer(message: string, channel = "downloadDolphinLog"): void {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send(channel, message);
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
    const data = await getLatestReleaseData(type);
    const latestVersion = data.tag_name;
    const isOutdated = await compareDolphinVersion(type, latestVersion);
    if (isOutdated) {
      log(`${type} Dolphin installation is outdated. Downloading latest...`);
      downloadAndInstallDolphin(type, log);
      return;
    }
    log("No update found...");
    return;
  } catch (err) {
    log(`Could not find ${type} Dolphin installation. Downloading...`);
    downloadAndInstallDolphin(type, log);
  }
}

export async function downloadAndInstallDolphin(
  type: DolphinLaunchType,
  log: (message: string) => void,
  cleanInstall = false,
): Promise<void> {
  const downloadedAsset = await downloadLatestDolphin(type, log);
  log(`Installing ${type} Dolphin...`);
  await installDolphin(type, downloadedAsset, log, cleanInstall);
  log(`Finished ${type} installing`);
}

export async function assertDolphinInstallations(): Promise<void> {
  try {
    await assertDolphinInstallation(DolphinLaunchType.NETPLAY, sendToRenderer);
    await assertDolphinInstallation(DolphinLaunchType.PLAYBACK, sendToRenderer);
    sendToRenderer("", "downloadDolphinFinished");
  } catch (err) {
    console.error(err);
    sendToRenderer(err.message, "downloadDolphinFinished");
  }
  return;
}

async function compareDolphinVersion(type: DolphinLaunchType, latestVersion: string): Promise<boolean> {
  const dolphinPath = await findDolphinExecutable(type);
  const dolphinVersion = spawnSync(dolphinPath, ["--version"]).stdout.toString();
  return lt(latestVersion, dolphinVersion);
}

export async function openDolphin(type: DolphinLaunchType, params?: string[]): Promise<ChildProcessWithoutNullStreams> {
  const dolphinPath = await findDolphinExecutable(type);
  return spawn(dolphinPath, params);
}

async function getLatestDolphinAsset(type: DolphinLaunchType): Promise<any> {
  const release = await getLatestReleaseData(type);
  const asset = release.assets.find((a: any) => matchesPlatform(a.name));
  if (!asset) {
    throw new Error(`No release asset matched the current platform: ${process.platform}`);
  }
  return asset;
}

async function getLatestReleaseData(type: DolphinLaunchType): Promise<any> {
  const owner = "project-slippi";
  let repo = "Ishiiruka";
  if (type === DolphinLaunchType.PLAYBACK) {
    repo += "-Playback";
  }
  return getLatestRelease(owner, repo);
}

function matchesPlatform(releaseName: string): boolean {
  switch (process.platform) {
    case "win32":
      return releaseName.endsWith("Win.zip");
    case "darwin":
      // FIXME: The netplay release sometimes provided in DMG format.
      // This is not what we expect since the playback release is in a ZIP format.
      // We need to ensure that in the future we only release in the ZIP format
      // so the launcher can unpack it.
      return releaseName.endsWith("Mac.zip");
    case "linux":
      return releaseName.endsWith(".AppImage");
    default:
      return false;
  }
}

async function downloadLatestDolphin(
  type: DolphinLaunchType,
  log: (status: string) => void = console.log,
): Promise<string> {
  const asset = await getLatestDolphinAsset(type);
  const downloadDir = app.getPath("temp");
  const downloadLocation = path.join(downloadDir, asset.name);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${asset.browser_download_url} to ${downloadLocation}`);
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      await download(win, asset.browser_download_url, {
        filename: asset.name,
        directory: downloadDir,
        onProgress: (progress) => log(`Downloading... ${(progress.percent * 100).toFixed(0)}%`),
      });
      log(`Successfully downloaded ${asset.browser_download_url} to ${downloadLocation}`);
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
  const backupLocation = dolphinPath + "_old";

  if (cleanInstall) {
    await fs.remove(dolphinPath);
  }

  switch (process.platform) {
    case "win32": {
      // don't need to backup user files since our zips don't contain them
      // and the overwrite won't make them disappear.
      log(`Extracting to: ${dolphinPath}`);
      const zip = new AdmZip(assetPath);
      zip.extractAllTo(dolphinPath, true);
      break;
    }
    case "darwin": {
      const dolphinResourcesPath = path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources");

      const alreadyInstalled = await fs.pathExists(dolphinResourcesPath);
      if (alreadyInstalled) {
        log(`${dolphinResourcesPath} already exists. Moving...`);
        await fs.move(dolphinResourcesPath, backupLocation);
      }

      log(`Extracting to: ${dolphinPath}`);
      const zip = new AdmZip(assetPath);
      zip.extractAllTo(dolphinPath, true);

      // Move backed up User folder and user.json
      if (alreadyInstalled) {
        const oldUserFolder = path.join(backupLocation, "User");
        const newUserFolder = path.join(dolphinResourcesPath, "User");

        const oldUserJSON = path.join(backupLocation, "user.json");
        const newUserJSON = path.join(dolphinResourcesPath, "user.json");

        if (await fs.pathExists(oldUserFolder)) {
          log("moving User folder...");
          await fs.move(oldUserFolder, newUserFolder);
        } else {
          log("no old User folder to move");
        }

        if (await fileExists(oldUserJSON)) {
          log("moving user.json...");
          await fs.move(oldUserJSON, newUserJSON);
        } else {
          log("no old user.json to move");
        }
        await fs.remove(backupLocation);
      }
      break;
    }
    case "linux": {
      // Delete the existing app image if there is one
      try {
        const dolphinAppImagePath = await findDolphinExecutable(type);
        // Delete the existing app image if it already exists
        if (await fileExists(dolphinAppImagePath)) {
          log(`${dolphinAppImagePath} already exists. Deleting...`);
          await fs.remove(dolphinAppImagePath);
        }
      } catch (err) {
        log("No existing AppImage found");
      }

      if (cleanInstall) {
        const userFolder = type === DolphinLaunchType.NETPLAY ? "SlippiOnline" : "SlippiPlayback";
        await fs.remove(path.join(app.getPath("home"), ".config", userFolder));
      }

      const assetFilename = path.basename(assetPath);
      const targetLocation = path.join(dolphinPath, assetFilename);

      // Actually move the app image to the correct folder
      log(`Moving ${assetPath} to ${targetLocation}`);
      await fs.rename(assetPath, targetLocation);

      // Make the file executable
      log(`Setting executable permissions...`);
      await fs.chmod(targetLocation, "755");
      break;
    }
    default: {
      throw new Error(`Installing Netplay is not supported on this platform: ${process.platform}`);
    }
  }
}
