import { settingsManager } from "@settings/settingsManager";
import log from "electron-log";
import * as fs from "fs-extra";
import * as ini from "ini";
import { fileExists } from "main/fileExists";
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

export async function addGamePathToInis(gameDir: string): Promise<void> {
  await addGamePathToIni(DolphinLaunchType.NETPLAY, gameDir);
  await addGamePathToIni(DolphinLaunchType.PLAYBACK, gameDir);
}

async function addGamePathToIni(type: DolphinLaunchType, gameDir: string): Promise<void> {
  const userFolder = await findUserFolder(type);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  if (await fileExists(iniPath)) {
    log.info("Found a Dolphin.ini to update...");
    const dolphinINI = ini.parse(await fs.readFile(iniPath, "utf-8"));
    dolphinINI.General.ISOPath0 = gameDir;
    const numPaths = dolphinINI.General.ISOPaths;
    dolphinINI.General.ISOPaths = numPaths !== "0" ? numPaths : "1";
    const newINI = ini.encode(dolphinINI);
    await fs.writeFile(iniPath, newINI);
  } else {
    log.info("There isn't a Dolphin.ini to update...");
    const configPath = path.join(userFolder, "Config");
    const newINI = ini.encode({ General: { ISOPath0: gameDir, ISOPaths: 1 } });
    await fs.ensureDir(configPath);
    await fs.writeFile(iniPath, newINI);
  }
  log.info(`Finished updating ${type} dolphin...`);
}
