import { copy } from "fs-extra";
import { chmod, chown, readdir, rm } from "node:fs/promises";
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

  const files = await readdir(destinationFolder);
  const filesToRemove = files.filter((file) => file !== "Slippi Dolphin.app");

  for (let i = 0; i < filesToRemove.length; i++) {
    const file = filesToRemove[i];
    await rm(path.join(destinationFolder, file), { recursive: true, force: true });
  }

  // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
  const binaryLocation = path.join(destinationFolder, "Slippi Dolphin.app", "Contents", "MacOS", "Slippi Dolphin");
  const userInfo = os.userInfo();

  await Promise.all([
    chmod(path.join(destinationFolder, "Slippi Dolphin.app"), "777"),
    chown(path.join(destinationFolder, "Slippi Dolphin.app"), userInfo.uid, userInfo.gid),
    chmod(binaryLocation, "777"),
    chown(binaryLocation, userInfo.uid, userInfo.gid),
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
    // Use fs-extra's copy() for macOS .app bundles.
    // Replacing this with fs.cp() has previously caused copied apps to fail
    // macOS code-signature validation ("app is damaged" errors).
    await copy(appMountPath, destPath, { recursive: true });
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
      chmod(path.join(destinationFolder, "Slippi_Dolphin.app"), "777"),
      chown(path.join(destinationFolder, "Slippi_Dolphin.app"), userInfo.uid, userInfo.gid),
      chmod(binaryLocation, "777"),
      chown(binaryLocation, userInfo.uid, userInfo.gid),
    ]);
  } catch {
    log("Could not chown/chmod Dolphin");
  }
}
