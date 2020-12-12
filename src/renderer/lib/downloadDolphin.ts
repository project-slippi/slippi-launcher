import * as fs from "fs-extra";
import path from "path";
import { remote } from "electron";
import { download } from "common/download";
import AdmZip from "adm-zip";
import { fetchPlayKey } from "./playkey";
import { fileExists } from "common/utils";
import { spawn } from "child_process";

const NETPLAY_PATH = path.join(remote.app.getPath("userData"), "netplay");

export async function assertDolphinInstallation(
  log: (message: string) => void
) {
  const dolphinExists = await fileExists(NETPLAY_PATH);
  if (!dolphinExists) {
    log("Downloading Dolphin...");
    await downloadLatestNetplay(log);
  }
}

export function openDolphin(params?: string[]) {
  const dolphinPath = getDolphinPath();
  spawn(dolphinPath, params);
}

function getDolphinPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(NETPLAY_PATH, "Dolphin.exe");
    default:
      throw new Error(`Unsupported OS: ${process.platform}`);
  }
}

function getPlayKeyPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(NETPLAY_PATH, "user.json");
    default:
      throw new Error(`Unsupported OS: ${process.platform}`);
  }
}

export async function assertPlayKey(): Promise<void> {
  const keyPath = getPlayKeyPath();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
  } else {
    const playKey = await fetchPlayKey();
    const contents = JSON.stringify(playKey, null, 2);
    await fs.writeFile(keyPath, contents);
  }
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
): Promise<void> {
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
  const extractToLocation = remote.app.getPath("userData");
  const zip = new AdmZip(downloadLocation);

  log(`Extracting to: ${extractToLocation}, and renaming to netplay`);
  zip.extractAllTo(extractToLocation, true);
  const oldPath = path.join(extractToLocation, "FM-Slippi");
  const newPath = NETPLAY_PATH;
  if (await fs.pathExists(newPath)) {
    log(`${newPath} already exists. Deleting...`);
    await fs.remove(newPath);
  }
  await fs.rename(oldPath, newPath);
}
