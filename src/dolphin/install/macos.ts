import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { extractDmg, mountDmg, unmountDmg } from "./extract_dmg";

export async function installIshiirukaDolphinOnMac({
  assetPath,
  destinationFolder,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  log(`Extracting to: ${destinationFolder}`);
  await extractDmg(assetPath, destinationFolder);

  const files = await fs.readdir(destinationFolder);
  const filesToRemove = files.filter((file) => file !== "Slippi Dolphin.app");

  for (let i = 0; i < filesToRemove.length; i++) {
    const file = filesToRemove[i];
    await fs.remove(path.join(destinationFolder, file));
  }

  // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
  const binaryLocation = path.join(destinationFolder, "Slippi Dolphin.app", "Contents", "MacOS", "Slippi Dolphin");
  const userInfo = os.userInfo();

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
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  log(`Extracting to: ${destinationFolder}`);

  const mountPath = await mountDmg(assetPath);
  try {
    const appMountPath = path.join(mountPath, "Slippi_Dolphin.app");
    const destPath = path.join(destinationFolder, "Slippi_Dolphin.app");
    await fs.copy(appMountPath, destPath, { recursive: true });
  } catch {
    log("Failed to copy files from DMG");
  } finally {
    await unmountDmg(mountPath);
  }

  try {
    // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
    const binaryLocation = path.join(destinationFolder, "Slippi_Dolphin.app", "Contents", "MacOS", "Slippi_Dolphin");
    const userInfo = os.userInfo();

    await Promise.all([
      fs.chmod(path.join(destinationFolder, "Slippi_Dolphin.app"), "777"),
      fs.chown(path.join(destinationFolder, "Slippi_Dolphin.app"), userInfo.uid, userInfo.gid),
      fs.chmod(binaryLocation, "777"),
      fs.chown(binaryLocation, userInfo.uid, userInfo.gid),
    ]);
  } catch {
    log("Could not chown/chmod Dolphin");
  }
}
