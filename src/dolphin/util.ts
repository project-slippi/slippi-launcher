import { settingsManager } from "@settings/settingsManager";
import * as fs from "fs-extra";
import os from "os";
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

  if (process.platform === "darwin") {
    return path.join(dolphinPath, result, "Contents", "MacOS", "Slippi Dolphin");
  }

  return path.join(dolphinPath, result);
}

export async function findUserFolder(type: DolphinLaunchType): Promise<string> {
  let userPath = "";
  const dolphinPath = settingsManager.getDolphinPath(type);
  switch (process.platform) {
    case "win32": {
      userPath = path.join(dolphinPath, "User");
      break;
    }
    case "darwin": {
      userPath = path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "User");
      break;
    }
    case "linux": {
      const configPath = path.join(os.homedir(), ".config");
      const userFolderName = type === DolphinLaunchType.NETPLAY ? "SlippiOnline" : "SlippiPlayback";
      userPath = path.join(configPath, userFolderName);
      break;
    }
    default:
      break;
  }

  fs.ensureDir(userPath);

  return userPath;
}
