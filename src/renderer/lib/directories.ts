import * as fs from "fs-extra";
import path from "path";
import { remote } from "electron";

export const NETPLAY_PATH = path.join(
  remote.app.getPath("userData"),
  "netplay"
);

export function getDefaultRootSlpPath(): string {
  let root = remote.app.getPath("home");
  if (process.platform === "win32") {
    root = remote.app.getPath("documents");
  }
  return path.join(root, "Slippi");
}

export async function findDolphinExecutable(): Promise<string> {
  // Make sure the directory actually exists
  await fs.ensureDir(NETPLAY_PATH);

  // Check the directory contents
  const files = await fs.readdir(NETPLAY_PATH);
  const result = files.find((filename) => {
    switch (process.platform) {
      case "win32":
        return filename.endsWith("Dolphin.exe");
      case "darwin":
        return filename.endsWith("Dolphin.app");
      case "linux":
        return filename.endsWith(".AppImage");
      default:
        return false;
    }
  });

  if (!result) {
    throw new Error(`No Dolphin found in: ${NETPLAY_PATH}`);
  }

  return path.join(NETPLAY_PATH, result);
}
