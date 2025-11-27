import type { DolphinInstallation } from "@dolphin/types";
import * as fs from "fs-extra";
import { async as AsyncStreamZip } from "node-stream-zip";

// TODO: Figure out how to make this not depend on DolphinLaunchType
export async function installDolphinOnLinux({
  assetPath,
  destinationFolder,
  installation,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  installation: DolphinInstallation;
  log?: (message: string) => void;
}) {
  try {
    const dolphinAppImagePath = await installation.findDolphinExecutable();
    log(`${dolphinAppImagePath} already exists. Deleting...`);
    await fs.remove(dolphinAppImagePath);
  } catch (_err) {
    log("No existing AppImage found");
  }

  const zip = new AsyncStreamZip({ file: assetPath });
  await zip.extract(null, destinationFolder);
  await zip.close();

  // make the appimage executable because sometimes it doesn't have the right perms out the gate
  const dolphinAppImagePath = await installation.findDolphinExecutable();
  log(`Setting executable permissions...`);
  await fs.chmod(dolphinAppImagePath, "755");
}
