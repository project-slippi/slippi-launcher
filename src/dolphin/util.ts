import { settingsManager } from "@settings/settingsManager";
import { app } from "electron";
import electronLog from "electron-log";
import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { addGamePath, setBootToCss, setSlippiSettings } from "./config/config";
import { IniFile } from "./config/iniFile";
import { DolphinLaunchType } from "./types";

const log = electronLog.scope("dolphin/utils");

export async function findDolphinExecutable(type: DolphinLaunchType, folder?: string): Promise<string> {
  // Make sure the directory actually exists
  let dolphinPath = folder;
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
      case "linux": {
        const appimagePrefix = type === DolphinLaunchType.NETPLAY ? "Slippi_Online" : "Slippi_Playback";
        return filename.startsWith(appimagePrefix) || filename.endsWith("dolphin-emu");
      }
      default:
        return false;
    }
  });

  if (!result) {
    throw new Error(
      `No ${type} Dolphin found in: ${dolphinPath}, try restarting the launcher. Ask in the Slippi Discord's support channels for further help`,
    );
  }

  if (process.platform === "darwin") {
    const dolphinBinaryPath = path.join(dolphinPath, result, "Contents", "MacOS", "Slippi Dolphin");
    const dolphinExists = await fs.pathExists(dolphinBinaryPath);
    if (!dolphinExists) {
      throw new Error(`No ${type} Dolphin found in: ${dolphinPath}, try resetting dolphin`);
    }
    return dolphinBinaryPath;
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

export async function addGamePathToIni(type: DolphinLaunchType, gameDir: string): Promise<void> {
  const userFolder = await findUserFolder(type);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  const iniFile = await IniFile.init(iniPath);
  return addGamePath(iniFile, gameDir);
}

export async function updateDolphinSettings(): Promise<void> {
  const userFolder = await findUserFolder(DolphinLaunchType.NETPLAY);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  const iniFile = await IniFile.init(iniPath);
  await setSlippiSettings(iniFile, {
    replayPath: settingsManager.getRootSlpPath(),
    useMonthlySubfolders: settingsManager.getUseMonthlySubfolders(),
  });
  log.info(`Finished updating ${DolphinLaunchType.NETPLAY} dolphin settings...`);
}

export async function updateBootToCssCode(options: { enable: boolean }) {
  const [userPath, sysPath] = await Promise.all([
    findUserFolder(DolphinLaunchType.NETPLAY),
    findSysFolder(DolphinLaunchType.NETPLAY),
  ]);

  // Update vanilla ISO configs
  await Promise.all(
    ["GALE01", "GALJ01"].map(async (id) => {
      const globalIniPath = path.join(sysPath, "GameSettings", `${id}r2.ini`);
      const localIniPath = path.join(userPath, "GameSettings", `${id}.ini`);
      const globalIni = await IniFile.init(globalIniPath);
      const localIni = await IniFile.init(localIniPath);
      return setBootToCss(globalIni, localIni, options.enable);
    }),
  );
}
