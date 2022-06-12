import type { DolphinLaunchType } from "@dolphin/types";
import { findDolphinExecutable } from "@dolphin/util";
import * as fs from "fs-extra";
import { async as AsyncStreamZip } from "node-stream-zip";

// TODO: Figure out how to make this not depend on DolphinLaunchType
export async function installDolphinOnLinux({
  type,
  assetPath,
  destinationFolder,
  log = console.log,
}: {
  type: DolphinLaunchType;
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  try {
    const dolphinAppImagePath = await findDolphinExecutable(type, destinationFolder);
    log(`${dolphinAppImagePath} already exists. Deleting...`);
    await fs.remove(dolphinAppImagePath);
  } catch (err) {
    log("No existing AppImage found");
  }

  const zip = new AsyncStreamZip({ file: assetPath });
  await zip.extract(null, destinationFolder);
  await zip.close();

  // make the appimage executable because sometimes it doesn't have the right perms out the gate
  const dolphinAppImagePath = await findDolphinExecutable(type, destinationFolder);
  log(`Setting executable permissions...`);
  await fs.chmod(dolphinAppImagePath, "755");
}
