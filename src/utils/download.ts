import * as fs from "fs-extra";
import { dirname } from "path";
import { download as wgetDownload } from "wget-improved";

import { fileExists } from "./fileExists";

export async function download(options: {
  url: string;
  destinationFile: string;
  onProgress?: (progress: { transferredBytes: number; totalBytes: number }) => void;
  overwrite?: boolean;
}): Promise<void> {
  const { url, destinationFile, onProgress, overwrite } = options;

  if (!overwrite && (await fileExists(destinationFile))) {
    throw new Error(`Could not download to ${destinationFile}. File already exists!`);
  }

  // Make sure the folder exists
  await fs.ensureDir(dirname(destinationFile));

  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    const downloader = wgetDownload(url, destinationFile);
    downloader.on("error", (err) => {
      fs.unlink(destinationFile, () => {
        reject(err);
      });
    });
    downloader.on("start", (fileSize: number | null) => {
      if (fileSize !== null) {
        totalBytes = fileSize;
      }
    });
    downloader.on("end", () => {
      resolve();
    });
    downloader.on("bytes", (transferredBytes: number) => {
      onProgress && onProgress({ transferredBytes, totalBytes });
    });
  });
}
