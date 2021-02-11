import path from "path";
import { app, remote } from "electron";
import * as fs from "fs-extra";

export enum DolphinType {
  NETPLAY = "netplay",
  PLAYBACK = "playback",
}

export async function findDolphinExecutable(type: DolphinType): Promise<string> {
  // Make sure the directory actually exists
  let dolphinPath = "";
  try {
    dolphinPath = path.join(app.getPath("userData"), type);
  } catch {
    dolphinPath = path.join(remote.app.getPath("userData"), type);
  }
  await fs.ensureDir(dolphinPath);

  // Check the directory contents
  const files = await fs.readdir(dolphinPath);
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
    throw new Error(`No Dolphin found in: ${dolphinPath}`);
  }

  return path.join(dolphinPath, result);
}
