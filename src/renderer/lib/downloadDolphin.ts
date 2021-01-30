import AdmZip from "adm-zip";
import { spawn } from "child_process";
import { download } from "common/download";
import { fileExists } from "common/utils";
import { remote } from "electron";
import * as fs from "fs-extra";
import path from "path";

import {
  DolphinType,
  findDolphinExecutable,
  NETPLAY_PATH,
  PLAYBACK_PATH,
} from "./directories";

export async function assertDolphinInstallation(
  log: (message: string) => void
): Promise<void> {
  try {
    await findDolphinExecutable(DolphinType.NETPLAY);
    log("Found existing Netplay Dolphin executable.");
  } catch (err) {
    log("Could not find Netplay Dolphin installation. Downloading...");
    const downloadedAsset = await downloadLatestNetplay(log);
    log("Installing Playback Dolphin...");
    await installNetplay(downloadedAsset);
  }
  try {
    await findDolphinExecutable(DolphinType.PLAYBACK);
    log("Found existing Playback Dolphin executable.");
  } catch (err) {
    log("Could not find Playback Dolphin installation. Downloading...");
    const downloadedAsset = await downloadLatestPlayback(log);
    log("Installing Playback Dolphin...");
    await installPlayback(downloadedAsset);
  }
}

export async function openDolphin(type: DolphinType, params?: string[]) {
  const dolphinPath = await findDolphinExecutable(type);
  spawn(dolphinPath, params);
}

async function getLatestNetplayAsset(): Promise<any> {
  const owner = "project-slippi";
  const repo = "Ishiiruka";
  const release = await getLatestRelease(owner, repo);
  const asset = release.assets.find((a: any) => matchesPlatform(a.name));
  if (!asset) {
    throw new Error("Could not fetch latest release");
  }
  return asset;
}

async function getLatestPlaybackAsset(): Promise<any> {
  const owner = "project-slippi";
  const repo = "Ishiiruka-Playback";
  const release = await getLatestRelease(owner, repo);
  const asset = release.assets.find((a: any) => matchesPlatform(a.name));
  if (!asset) {
    throw new Error("Could not fetch latest release");
  }
  return asset;
}

async function getLatestRelease(owner: string, repo: string): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

function matchesPlatform(releaseName: string): boolean {
  switch (process.platform) {
    case "win32":
      return releaseName.endsWith("Win.zip");
    case "darwin":
      return releaseName.endsWith("Mac.zip");
    case "linux":
      return releaseName.endsWith(".AppImage");
    default:
      return false;
  }
}

async function downloadLatestNetplay(
  log: (status: string) => void = console.log
): Promise<string> {
  const asset = await getLatestNetplayAsset();
  const downloadLocation = path.join(remote.app.getPath("temp"), asset.name);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${asset.browser_download_url} to ${downloadLocation}`);
    await download(asset.browser_download_url, downloadLocation, (percent) =>
      log(`Downloading... ${(percent * 100).toFixed(0)}%`)
    );
    log(
      `Successfully downloaded ${asset.browser_download_url} to ${downloadLocation}`
    );
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}

async function downloadLatestPlayback(
  log: (status: string) => void = console.log
): Promise<string> {
  const asset = await getLatestPlaybackAsset();
  const downloadLocation = path.join(remote.app.getPath("temp"), asset.name);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${asset.browser_download_url} to ${downloadLocation}`);
    await download(asset.browser_download_url, downloadLocation, (percent) =>
      log(`Downloading... ${(percent * 100).toFixed(0)}%`)
    );
    log(
      `Successfully downloaded ${asset.browser_download_url} to ${downloadLocation}`
    );
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}

async function installNetplay(
  assetPath: string,
  log: (message: string) => void = console.log
) {
  switch (process.platform) {
    case "win32": {
      const extractToLocation = remote.app.getPath("userData");
      const zip = new AdmZip(assetPath);
      log(`Extracting to: ${extractToLocation}, and renaming to netplay`);
      zip.extractAllTo(extractToLocation, true);
      const oldPath = path.join(extractToLocation, "FM-Slippi");
      const newPath = NETPLAY_PATH;
      if (await fs.pathExists(newPath)) {
        log(`${newPath} already exists. Deleting...`);
        await fs.remove(newPath);
        log(`${newPath} deleted`);
      }
      await fs.rename(oldPath, newPath);
      break;
    }
    case "darwin": {
      const extractToLocation = NETPLAY_PATH;
      if (await fs.pathExists(extractToLocation)) {
        log(`${extractToLocation} already exists. Deleting...`);
        await fs.remove(extractToLocation);
      } else {
        // Ensure the directory exists
        await fs.ensureDir(extractToLocation);
      }
      const zip = new AdmZip(assetPath);
      log(`Extracting to: ${extractToLocation}`);
      zip.extractAllTo(extractToLocation, true);
      break;
    }
    case "linux": {
      // Delete the existing app image if there is one
      try {
        const dolphinAppImagePath = await findDolphinExecutable(
          DolphinType.NETPLAY
        );
        // Delete the existing app image if it already exists
        if (await fileExists(dolphinAppImagePath)) {
          log(`${dolphinAppImagePath} already exists. Deleting...`);
          await fs.remove(dolphinAppImagePath);
        }
      } catch (err) {
        // There's no app image
        log("No existing AppImage found");
      }

      const assetFilename = path.basename(assetPath);
      const targetLocation = path.join(NETPLAY_PATH, assetFilename);

      // Actually move the app image to the correct folder
      log(`Moving ${assetPath} to ${targetLocation}`);
      await fs.rename(assetPath, targetLocation);

      // Make the file executable
      log(`Setting executable permissions...`);
      await fs.chmod(targetLocation, "755");
      break;
    }
    default: {
      throw new Error(
        `Installing Netplay is not supported on this platform: ${process.platform}`
      );
    }
  }
}

async function installPlayback(
  assetPath: string,
  log: (message: string) => void = console.log
) {
  switch (process.platform) {
    case "win32": {
      const zip = new AdmZip(assetPath);
      if (await fs.pathExists(PLAYBACK_PATH)) {
        log(`${PLAYBACK_PATH} already exists. Deleting...`);
        await fs.remove(PLAYBACK_PATH);
      }
      log(`Extracting to: ${PLAYBACK_PATH}`);
      zip.extractAllTo(PLAYBACK_PATH, true);
      break;
    }
    case "darwin": {
      const extractToLocation = PLAYBACK_PATH;
      if (await fs.pathExists(extractToLocation)) {
        log(`${extractToLocation} already exists. Deleting...`);
        await fs.remove(extractToLocation);
      } else {
        // Ensure the directory exists
        await fs.ensureDir(extractToLocation);
      }
      const zip = new AdmZip(assetPath);
      log(`Extracting to: ${extractToLocation}`);
      zip.extractAllTo(extractToLocation, true);
      break;
    }
    case "linux": {
      // Delete the existing app image if there is one
      try {
        const dolphinAppImagePath = await findDolphinExecutable(
          DolphinType.PLAYBACK
        );
        // Delete the existing app image if it already exists
        if (await fileExists(dolphinAppImagePath)) {
          log(`${dolphinAppImagePath} already exists. Deleting...`);
          await fs.remove(dolphinAppImagePath);
        }
      } catch (err) {
        // There's no app image
        log("No existing AppImage found");
      }

      const assetFilename = path.basename(assetPath);
      const targetLocation = path.join(PLAYBACK_PATH, assetFilename);

      // Actually move the app image to the correct folder
      log(`Moving ${assetPath} to ${targetLocation}`);
      await fs.rename(assetPath, targetLocation);

      // Make the file executable
      log(`Setting executable permissions...`);
      await fs.chmod(targetLocation, "755");
      break;
    }
    default: {
      throw new Error(
        `Installing Netplay is not supported on this platform: ${process.platform}`
      );
    }
  }
}
