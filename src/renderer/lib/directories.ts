import { remote } from "electron";
import * as fs from "fs-extra";
import path from "path";

export const NETPLAY_PATH = path.join(
  remote.app.getPath("userData"),
  "netplay"
);

export const PLAYBACK_PATH = path.join(
  remote.app.getPath("userData"),
  "playback"
);

export enum DolphinType {
  NETPLAY = "netplay",
  PLAYBACK = "playback",
}

export function getDefaultRootSlpPath(): string {
  let root = remote.app.getPath("home");
  if (process.platform === "win32") {
    root = remote.app.getPath("documents");
  }
  return path.join(root, "Slippi");
}

export async function findDolphinExecutable(
  type: DolphinType
): Promise<string> {
  // Make sure the directory actually exists
  const dolphin_path = path.join(remote.app.getPath("userData"), type);
  await fs.ensureDir(dolphin_path);

  // Check the directory contents
  const files = await fs.readdir(dolphin_path);
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
    throw new Error(`No Dolphin found in: ${dolphin_path}`);
  }

  return path.join(dolphin_path, result);
}
