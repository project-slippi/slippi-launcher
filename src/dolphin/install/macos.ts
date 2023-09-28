import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { extractDmg } from "./extractDmg";

export async function installDolphinOnMac({
  assetPath,
  destinationFolder,
  dolphinName,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  dolphinName: string;
  log?: (message: string) => void;
}) {
  log(`Extracting to: ${destinationFolder}`);
  const appName = `${dolphinName}.app`;
  await extractDmg(assetPath, destinationFolder);
  const files = await fs.readdir(destinationFolder);
  await Promise.all(
    files
      .filter((file) => file !== appName)
      .map(async (file) => {
        await fs.remove(path.join(destinationFolder, file));
      }),
  );

  // sometimes permissions aren't set properly after the extraction so we will forcibly set them on install
  const binaryLocation = path.join(destinationFolder, appName, "Contents", "MacOS", dolphinName);
  const userInfo = os.userInfo();
  await fs.chmod(path.join(destinationFolder, appName), "777");
  await fs.chown(path.join(destinationFolder, appName), userInfo.uid, userInfo.gid);
  await fs.chmod(binaryLocation, "777");
  await fs.chown(binaryLocation, userInfo.uid, userInfo.gid);
}
