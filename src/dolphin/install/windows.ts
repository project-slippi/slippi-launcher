import { rm } from "node:fs/promises";
import { async as AsyncStreamZip } from "node-stream-zip";
import path from "path";

export async function installDolphinOnWindows({
  assetPath,
  destinationFolder,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  // clear Sys folder in case of file removals
  const sysFolder = path.join(destinationFolder, "Sys");
  await rm(sysFolder, { recursive: true, force: true });

  // don't need to backup user files since our zips don't contain them
  log(`Extracting ${assetPath} to: ${destinationFolder}`);
  const zip = new AsyncStreamZip({ file: assetPath });
  await zip.extract(null, destinationFolder);
  await zip.close();
}
