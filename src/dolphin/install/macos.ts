import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { extractDmg } from "./extractDmg";

export async function installDolphinOnMac({
  assetPath,
  destinationFolder,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  const backupLocation = destinationFolder + "_old";
  const dolphinResourcesPath = path.join(destinationFolder, "Slippi Dolphin.app", "Contents", "Resources");

  const alreadyInstalled = await fs.pathExists(dolphinResourcesPath);
  if (alreadyInstalled) {
    log(`${dolphinResourcesPath} already exists. Moving...`);
    await fs.move(destinationFolder, backupLocation);
  }

  log(`Extracting to: ${destinationFolder}`);
  await extractDmg(assetPath, destinationFolder);
  const files = await fs.readdir(destinationFolder);
  await Promise.all(
    files
      .filter((file) => file !== "Slippi Dolphin.app")
      .map(async (file) => {
        await fs.remove(path.join(destinationFolder, file));
      }),
  );

  // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
  const binaryLocation = path.join(destinationFolder, "Slippi Dolphin.app", "Contents", "MacOS", "Slippi Dolphin");
  const userInfo = os.userInfo();
  await fs.chmod(path.join(destinationFolder, "Slippi Dolphin.app"), "777");
  await fs.chown(path.join(destinationFolder, "Slippi Dolphin.app"), userInfo.uid, userInfo.gid);
  await fs.chmod(binaryLocation, "777");
  await fs.chown(binaryLocation, userInfo.uid, userInfo.gid);

  // move backed up User folder and user.json
  if (alreadyInstalled) {
    const oldUserFolder = path.join(backupLocation, "Slippi Dolphin.app", "Contents", "Resources", "User");
    const newUserFolder = path.join(dolphinResourcesPath, "User");
    log("moving User folder...");
    await fs.move(oldUserFolder, newUserFolder);
    await fs.remove(backupLocation);
  }
}
