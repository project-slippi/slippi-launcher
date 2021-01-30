import AdmZip from "adm-zip";
import { spawn } from "child_process";
import { download } from "common/download";
import { fileExists } from "common/utils";
import { remote } from "electron";
import * as fs from "fs-extra";
import path from "path";

import { DolphinType, findDolphinExecutable } from "./directories";

export async function assertDolphinInstallation(
  type: DolphinType,
  log: (message: string) => void
): Promise<void> {
  try {
    await findDolphinExecutable(type);
    log(`Found existing ${type} Dolphin executable.`);
    return;
  } catch (err) {
    log(`Could not find ${type} Dolphin installation. Downloading...`);
    const downloadedAsset = await downloadLatestDolphin(type, log);
    log(`Installing ${type} Dolphin...`);
    await installDolphin(type, downloadedAsset);
  }
}

export async function assertDolphinInstallations(
  log: (message: string) => void
): Promise<void> {
  await assertDolphinInstallation(DolphinType.NETPLAY, log);
  await assertDolphinInstallation(DolphinType.PLAYBACK, log);
  return;
}

export async function openDolphin(type: DolphinType, params?: string[]) {
  const dolphinPath = await findDolphinExecutable(type);
  spawn(dolphinPath, params);
}

async function getLatestDolphinAsset(type: DolphinType): Promise<any> {
  const owner = "project-slippi";
  let repo = "Ishiiruka";
  if (type === DolphinType.PLAYBACK) {
    repo += "-Playback";
  }
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

async function downloadLatestDolphin(
  type: DolphinType,
  log: (status: string) => void = console.log
): Promise<string> {
  const asset = await getLatestDolphinAsset(type);
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

async function installDolphin(
  type: DolphinType,
  assetPath: string,
  log: (message: string) => void = console.log
) {
  const dolphin_path = path.join(remote.app.getPath("userData"), type);
  switch (process.platform) {
    case "win32": {
      const zip = new AdmZip(assetPath);
      if (await fs.pathExists(dolphin_path)) {
        log(`${dolphin_path} already exists. Deleting...`);
        await fs.remove(dolphin_path);
      }
      log(`Extracting to: ${dolphin_path}`);
      zip.extractAllTo(dolphin_path, true);
      break;
    }
    case "darwin": {
      const extractToLocation = dolphin_path;
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
        const dolphinAppImagePath = await findDolphinExecutable(type);
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
      const targetLocation = path.join(dolphin_path, assetFilename);

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
