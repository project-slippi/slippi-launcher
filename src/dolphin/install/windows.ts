import { remove } from "fs-extra";
import { async as AsyncStreamZip } from "node-stream-zip";
import path from "path";

type ProgressCallback = (message: string) => void;

function createProgressCallback(onProgress?: ProgressCallback) {
  return (message: string) => {
    if (onProgress) {
      onProgress(message);
    }
  };
}

export async function installDolphinOnWindows({
  assetPath,
  destinationFolder,
  onProgress,
}: {
  assetPath: string;
  destinationFolder: string;
  onProgress?: (message: string) => void;
}) {
  const progressLog = createProgressCallback(onProgress);

  // clear Sys folder in case of file removals
  const sysFolder = path.join(destinationFolder, "Sys");
  progressLog("Removing existing Sys folder...");
  await remove(sysFolder);

  // don't need to backup user files since our zips don't contain them
  progressLog(`Extracting ${assetPath} to: ${destinationFolder}`);

  const zip = new AsyncStreamZip({ file: assetPath });

  // Add progress tracking for extraction
  zip.on("entry", (entry) => {
    progressLog(`Extracting: ${entry.name}`);
  });

  await zip.extract(null, destinationFolder);
  await zip.close();

  progressLog("Windows installation complete");
}
