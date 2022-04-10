import { DolphinLaunchType } from "@dolphin/types";
import { BrowserWindow } from "electron";
import { download } from "electron-dl";
import * as fs from "fs-extra";
import path from "path";
import { fileExists } from "utils/fileExists";

import { getLatestRelease } from "../../main/github";

async function getLatestDolphinAsset(type: DolphinLaunchType): Promise<any> {
  const release = await getLatestReleaseData(type);
  const asset = release.assets.find(({ name }: { name: string }) => matchesPlatform(name));
  if (!asset) {
    throw new Error(`No release asset matched the current platform: ${process.platform}`);
  }
  return asset;
}

export async function getLatestReleaseData(type: DolphinLaunchType): Promise<any> {
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
      return releaseName.endsWith("Mac.dmg");
    case "linux":
      return releaseName.endsWith("Linux.zip");
    default:
      return false;
  }
}

export async function downloadLatestDolphin(
  type: DolphinLaunchType,
  destinationFolder: string,
  onProgress: (current: number, total: number) => void,
  log: (status: string) => void = console.log,
): Promise<string> {
  const asset = await getLatestDolphinAsset(type);
  await fs.ensureDir(destinationFolder);
  const downloadLocation = path.join(destinationFolder, asset.name);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${asset.browser_download_url} to ${downloadLocation}`);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("Error downloading dolphin. No browser window detected.");
    }
    await download(win, asset.browser_download_url, {
      filename: asset.name,
      directory: destinationFolder,
      onProgress: (progress) => onProgress(progress.transferredBytes, progress.totalBytes),
    });
    log(`Successfully downloaded ${asset.browser_download_url} to ${downloadLocation}`);
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}
