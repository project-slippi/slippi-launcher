import AdmZip from "adm-zip";
import { spawn, spawnSync } from "child_process";
import { download } from "common/download";
import { fileExists } from "common/utils";
import { remote } from "electron";
import * as fs from "fs-extra";
import path from "path";
import { lt } from "semver";

import { DolphinType, findDolphinExecutable } from "./directories";

export async function assertDolphinInstallation(
  type: DolphinType,
  log: (message: string) => void
): Promise<void> {
  try {
    await findDolphinExecutable(type);
    log(`Found existing ${type} Dolphin executable.`);
    log(`Checking if we need to update`);
    const data = await getLatestReleaseData(type);
    const latest_version = data.tag_name?.substring(1);
    const is_outdated = await compareDolphinVersion(type, latest_version);
    if (is_outdated) {
      log(`${type} Dolphin installation is outdated. Downloading latest...`);
      const downloadedAsset = await downloadLatestDolphin(type, log);
      log(`Installing ${type} Dolphin...`);
      await installDolphin(type, downloadedAsset);
      return;
    }
    log("No update found...");
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

async function compareDolphinVersion(
  type: DolphinType,
  latest_version: string
): Promise<boolean> {
  const dolphin_path = await findDolphinExecutable(type);
  const dolphin_version = spawnSync(dolphin_path, [
    "--version",
  ]).stdout.toString();
  return lt(latest_version, dolphin_version);
}

export async function openDolphin(type: DolphinType, params?: string[]) {
  const dolphinPath = await findDolphinExecutable(type);
  spawn(dolphinPath, params);
}

async function getLatestDolphinAsset(type: DolphinType): Promise<any> {
  const release = await getLatestReleaseData(type);
  const asset = release.assets.find((a: any) => matchesPlatform(a.name));
  if (!asset) {
    throw new Error("Could not fetch latest release");
  }
  return asset;
}

async function getLatestReleaseData(type: DolphinType): Promise<any> {
  const owner = "project-slippi";
  let repo = "Ishiiruka";
  if (type === DolphinType.PLAYBACK) {
    repo += "-Playback";
  }
  return getLatestRelease(owner, repo);
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
      const user_folder_path = path.join(dolphin_path, "User");
      const bkp_user_folder_path = path.join(
        remote.app.getPath("userData"),
        "Userbkp"
      );

      const zip = new AdmZip(assetPath);
      const already_installed = await fs.pathExists(dolphin_path);
      if (already_installed) {
        log(
          `${dolphin_path} already exists. Backing up User folder and deleting ${type} dolphin...`
        );
        await fs.move(user_folder_path, bkp_user_folder_path);
        await fs.remove(dolphin_path);
      }

      log(`Extracting to: ${dolphin_path}`);
      zip.extractAllTo(dolphin_path, true);
      if (already_installed)
        await fs.move(bkp_user_folder_path, user_folder_path);
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
