import path from "path";
import { download } from "utils/download";
import { fileExists } from "utils/fileExists";

export async function downloadLatestDolphin(
  downloadUrl: string,
  destinationFolder: string,
  onProgress: (current: number, total: number) => void,
  log: (status: string) => void = console.log,
): Promise<string> {
  const parsedUrl = new URL(downloadUrl);
  const filename = path.basename(parsedUrl.pathname);
  const downloadLocation = path.join(destinationFolder, filename);
  const exists = await fileExists(downloadLocation);
  if (!exists) {
    log(`Downloading ${downloadUrl} to ${downloadLocation}`);
    await download(downloadUrl, downloadLocation, onProgress);
    log(`Successfully downloaded ${downloadUrl} to ${downloadLocation}`);
  } else {
    log(`${downloadLocation} already exists. Skipping download.`);
  }
  return downloadLocation;
}
