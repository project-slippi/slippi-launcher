import AdmZip from "adm-zip";
import * as fs from "fs-extra";

export async function installDolphinOnLinux({
  dolphinAppImagePath,
  assetPath,
  destinationFolder,
  log = () => null,
}: {
  dolphinAppImagePath: string;
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  log(`Removing existing app iamge if it exists: ${dolphinAppImagePath}`);
  await fs.remove(dolphinAppImagePath);

  const zip = new AdmZip(assetPath);
  zip.extractAllTo(destinationFolder, true);

  // make the appimage executable because sometimes it doesn't have the right perms out the gate
  log(`Setting executable permissions...`);
  await fs.chmod(dolphinAppImagePath, "755");
}
