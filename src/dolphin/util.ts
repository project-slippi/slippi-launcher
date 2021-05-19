import { settingsManager } from "@settings/settingsManager";
import * as fs from "fs-extra";
import path from "path";

import { DolphinLaunchType } from "./types";


export async function findDolphinExecutable(type: DolphinLaunchType | string, dolphinPath?: string): Promise<string> {
  // Make sure the directory actually exists
  if (!dolphinPath) {
    dolphinPath = settingsManager.getDolphinPath(type as DolphinLaunchType);
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
