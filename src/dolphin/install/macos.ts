import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { extractDmg, mountDmg, unmountDmg } from "./extract_dmg";

type ProgressCallback = (message: string) => void;

function createProgressCallback(onProgress?: ProgressCallback) {
  return (message: string) => {
    if (onProgress) {
      onProgress(message);
    }
  };
}

export async function installIshiirukaDolphinOnMac({
  assetPath,
  destinationFolder,
  onProgress,
}: {
  assetPath: string;
  destinationFolder: string;
  onProgress?: (message: string) => void;
}) {
  const progressLog = createProgressCallback(onProgress);
  progressLog(`Extracting to: ${destinationFolder}`);
  await extractDmg(assetPath, destinationFolder, progressLog);

  const files = await fs.readdir(destinationFolder);
  const filesToRemove = files.filter((file) => file !== "Slippi Dolphin.app");

  // Remove files in parallel with progress tracking
  for (let i = 0; i < filesToRemove.length; i++) {
    const file = filesToRemove[i];
    progressLog(`Removing file ${i + 1}/${filesToRemove.length}: ${file}`);
    await fs.remove(path.join(destinationFolder, file));
  }

  // sometimes permissions aren't set properly after extraction so we will forcibly set them on install
  const binaryLocation = path.join(destinationFolder, "Slippi Dolphin.app", "Contents", "MacOS", "Slippi Dolphin");
  const userInfo = os.userInfo();
  progressLog("Setting permissions...");

  await Promise.all([
    fs.chmod(path.join(destinationFolder, "Slippi Dolphin.app"), "777"),
    fs.chown(path.join(destinationFolder, "Slippi Dolphin.app"), userInfo.uid, userInfo.gid),
    fs.chmod(binaryLocation, "777"),
    fs.chown(binaryLocation, userInfo.uid, userInfo.gid),
  ]);
}

export async function installMainlineDolphinOnMac({
  assetPath,
  destinationFolder,
  onProgress,
}: {
  assetPath: string;
  destinationFolder: string;
  onProgress?: (message: string) => void;
}) {
  const progressLog = createProgressCallback(onProgress);
  progressLog(`Extracting to: ${destinationFolder}`);

  const mountPath = await mountDmg(assetPath, progressLog);
  try {
    const appMountPath = path.join(mountPath, "Slippi_Dolphin.app");
    const destPath = path.join(destinationFolder, "Slippi_Dolphin.app");
    progressLog("Copying Dolphin application...");
    await fs.copy(appMountPath, destPath, { recursive: true });
  } catch {
    progressLog("Failed to copy files from DMG");
  } finally {
    await unmountDmg(mountPath, progressLog);
  }

  try {
    // sometimes permissions aren't set properly after extraction so we will forcibly set them on install
    const binaryLocation = path.join(destinationFolder, "Slippi_Dolphin.app", "Contents", "MacOS", "Slippi_Dolphin");
    const userInfo = os.userInfo();
    progressLog("Setting permissions...");

    await Promise.all([
      fs.chmod(path.join(destinationFolder, "Slippi_Dolphin.app"), "777"),
      fs.chown(path.join(destinationFolder, "Slippi_Dolphin.app"), userInfo.uid, userInfo.gid),
      fs.chmod(binaryLocation, "777"),
      fs.chown(binaryLocation, userInfo.uid, userInfo.gid),
    ]);
  } catch {
    progressLog("Could not chown/chmod Dolphin");
  }
}
