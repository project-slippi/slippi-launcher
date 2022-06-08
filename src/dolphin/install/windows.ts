import StreamZip from "node-stream-zip";

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
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: assetPath });
  await zip.extract(null, destinationFolder);
  await zip.close();
}
