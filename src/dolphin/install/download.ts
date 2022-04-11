import { BrowserWindow } from "electron";
import { download } from "electron-dl";
import * as fs from "fs-extra";
import path from "path";
import { fileExists } from "utils/fileExists";

export async function downloadLatestDolphin(
  downloadUrl: string,
  destinationFolder: string,
  onProgress: (current: number, total: number) => void,
  log: (status: string) => void = console.log,
): Promise<string> {
  const parsedUrl = new URL(downloadUrl);
  const filename = path.basename(parsedUrl.pathname);
  await fs.ensureDir(destinationFolder);
  const downloadLocation = path.join(destinationFolder, filename);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${downloadUrl} to ${downloadLocation}`);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("Error downloading dolphin. No browser window detected.");
    }
    await download(win, downloadUrl, {
      filename,
      directory: destinationFolder,
      onProgress: (progress) => onProgress(progress.transferredBytes, progress.totalBytes),
    });
    log(`Successfully downloaded ${downloadUrl} to ${downloadLocation}`);
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}
