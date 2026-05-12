import type { DolphinInstallation } from "@dolphin/types";
import * as fs from "fs-extra";
import { async as AsyncStreamZip } from "node-stream-zip";

type ProgressCallback = (message: string) => void;

function createProgressCallback(onProgress?: ProgressCallback) {
  return (message: string) => {
    if (onProgress) {
      onProgress(message);
    }
  };
}

// TODO: Figure out how to make this not depend on DolphinLaunchType
export async function installDolphinOnLinux({
  assetPath,
  destinationFolder,
  installation,
  onProgress,
}: {
  assetPath: string;
  destinationFolder: string;
  installation: DolphinInstallation;
  onProgress?: (message: string) => void;
}) {
  const progressLog = createProgressCallback(onProgress);

  try {
    const dolphinAppImagePath = await installation.findDolphinExecutable();
    progressLog(`${dolphinAppImagePath} already exists. Deleting...`);
    await fs.remove(dolphinAppImagePath);
  } catch (err) {
    progressLog("No existing AppImage found");
  }

  progressLog("Extracting ZIP archive...");
  const zip = new AsyncStreamZip({ file: assetPath });

  // Add progress tracking for extraction
  zip.on("entry", (entry) => {
    progressLog(`Extracting: ${entry.name}`);
  });

  await zip.extract(null, destinationFolder);
  await zip.close();

  // make appimage executable because sometimes it doesn't have right perms out of gate
  const dolphinAppImagePath = await installation.findDolphinExecutable();
  progressLog("Setting executable permissions...");
  await fs.chmod(dolphinAppImagePath, "755");

  progressLog("Linux installation complete");
}
