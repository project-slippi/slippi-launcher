import AdmZip from "adm-zip";

export async function installDolphinOnWindows({
  assetPath,
  destinationFolder,
  log = console.log,
}: {
  assetPath: string;
  destinationFolder: string;
  log?: (message: string) => void;
}) {
  // don't need to backup user files since our zips don't contain them
  log(`Extracting ${assetPath} to: ${destinationFolder}`);
  const zip = new AdmZip(assetPath);
  zip.extractAllTo(destinationFolder, true);
}
