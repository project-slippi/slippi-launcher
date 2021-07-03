import { settingsManager } from "@settings/settingsManager";
import { app } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import { fileExists } from "main/fileExists";
import os from "os";
import path from "path";

import { IniFile } from "./iniFile";
import { DolphinLaunchType } from "./types";

export async function findDolphinExecutable(type: DolphinLaunchType, dolphinPath?: string): Promise<string> {
  // Make sure the directory actually exists
  if (!dolphinPath) {
    dolphinPath = settingsManager.getDolphinPath(type);
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
        return filename.endsWith(".AppImage") || filename.endsWith("dolphin-emu");
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

  await fs.ensureDir(userPath);

  return userPath;
}

export async function findSysFolder(type: DolphinLaunchType): Promise<string> {
  let sysPath = "";
  const dolphinPath = settingsManager.getDolphinPath(type);
  switch (process.platform) {
    case "win32": {
      sysPath = path.join(dolphinPath, "Sys");
      break;
    }
    case "darwin": {
      sysPath = path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "Sys");
      break;
    }
    case "linux": {
      sysPath = path.join(app.getPath("userData"), type, "Sys");
      break;
    }
    default:
      break;
  }

  await fs.ensureDir(sysPath);

  return sysPath;
}

export async function addGamePathToInis(gameDir: string): Promise<void> {
  await addGamePathToIni(DolphinLaunchType.NETPLAY, gameDir);
  await addGamePathToIni(DolphinLaunchType.PLAYBACK, gameDir);
}

export async function addGamePathToIni(type: DolphinLaunchType, gameDir: string): Promise<void> {
  const userFolder = await findUserFolder(type);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  const iniFile = new IniFile();
  if (await fileExists(iniPath)) {
    log.info("Found a Dolphin.ini to update...");
    await iniFile.load(iniPath, false);
    const generalSection = iniFile.getOrCreateSection("General");
    const numPaths = generalSection.get("ISOPaths", "0");
    generalSection.set("ISOPaths", numPaths !== "0" ? numPaths : "1");
    generalSection.set("ISOPath0", gameDir);
  } else {
    log.info("There isn't a Dolphin.ini to update...");
    const generalSection = iniFile.getOrCreateSection("General");
    generalSection.set("ISOPaths", "1");
    generalSection.set("ISOPath0", gameDir);
  }
  iniFile.save(iniPath);
  log.info(`Finished updating ${type} dolphin...`);
}
