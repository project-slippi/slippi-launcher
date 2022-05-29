import log from "electron-log";
import path from "path";
import { download } from "utils/download";
import { fileExists } from "utils/fileExists";

export async function downloadLatestDolphin(
  downloadUrl: string,
  destinationFolder: string,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const parsedUrl = new URL(downloadUrl);
  const filename = path.basename(parsedUrl.pathname);
  const downloadLocation = path.join(destinationFolder, filename);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log.info(`Downloading ${downloadUrl} to ${downloadLocation}`);
    await download({
      url: downloadUrl,
      destinationFile: downloadLocation,
      overwrite: true,
      onProgress: ({ transferredBytes, totalBytes }) => onProgress && onProgress(transferredBytes, totalBytes),
    });
    log.info(`Successfully downloaded ${downloadUrl} to ${downloadLocation}`);
  } else {
    log.info(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}
