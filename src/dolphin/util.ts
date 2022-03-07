import { settingsManager } from "@settings/settingsManager";
import { app } from "electron";
import electronLog from "electron-log";
import * as fs from "fs-extra";
import { fileExists } from "main/fileExists";
import os from "os";
import path from "path";

import type { GeckoCode } from "./geckoCode";
import { loadGeckoCodes, saveCodes } from "./geckoCode";
import { IniFile } from "./iniFile";
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

export async function addGamePathToInis(gameDir: string): Promise<void> {
  await addGamePathToIni(DolphinLaunchType.NETPLAY, gameDir);
  await addGamePathToIni(DolphinLaunchType.PLAYBACK, gameDir);
}

export async function addGamePathToIni(type: DolphinLaunchType, gameDir: string): Promise<void> {
  const userFolder = await findUserFolder(type);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  const iniFile = new IniFile();
  if (await fileExists(iniPath)) {
    log.info("Updating game path...");
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

export async function updateDolphinSettings(): Promise<void> {
  const userFolder = await findUserFolder(DolphinLaunchType.NETPLAY);
  const iniPath = path.join(userFolder, "Config", "Dolphin.ini");
  const iniFile = new IniFile();
  const updateSettings = () => {
    const replayPath = settingsManager.getRootSlpPath();
    const useMonthlySubfolders = settingsManager.getUseMonthlySubfolders() ? "True" : "False";
    const coreSection = iniFile.getOrCreateSection("Core");
    coreSection.set("SlippiReplayDir", replayPath);
    coreSection.set("SlippiReplayMonthFolders", useMonthlySubfolders);
  };
  if (await fileExists(iniPath)) {
    log.info("Updating dolphin settings...");
    await iniFile.load(iniPath);
    updateSettings();
  } else {
    log.info("There isn't a Dolphin.ini to update...");
    updateSettings();
  }
  iniFile.save(iniPath);
  log.info(`Finished updating ${DolphinLaunchType.NETPLAY} dolphin settings...`);
}

export async function updateBootToCssCode(options: { enable: boolean }) {
  // Update vanilla ISO configs
  ["GALE01", "GALJ01"].forEach(async (id) => {
    const userPath = await findUserFolder(DolphinLaunchType.NETPLAY);
    const sysPath = await findSysFolder(DolphinLaunchType.NETPLAY);
    const globalIniPath = path.join(sysPath, "GameSettings", `${id}r2.ini`);
    const localIniPath = path.join(userPath, "GameSettings", `${id}.ini`);
    await bootToCss(globalIniPath, localIniPath, options.enable);
  });
}

async function bootToCss(globalIniPath: string, localIniPath: string, enable: boolean) {
  const globalIni = new IniFile();
  const localIni = new IniFile();
  if (await fs.pathExists(globalIniPath)) {
    log.info(`found global ini file: ${globalIniPath}`);
    await globalIni.load(globalIniPath);
  }
  if (await fs.pathExists(localIniPath)) {
    log.info(`found local ini file: ${localIniPath}`);
    await localIni.load(localIniPath);
  }

  const geckoCodes = loadGeckoCodes(globalIni, localIni);
  const bootCodeIdx = geckoCodes.findIndex((code) => code.name === "Boot to CSS");

  if (bootCodeIdx === -1) {
    const bootToCssCode: GeckoCode = {
      codeLines: ["041BFA20 38600002"],
      creator: "Dan Salvato, Achilles",
      defaultEnabled: false,
      enabled: enable,
      name: "Boot to CSS",
      notes: [],
      userDefined: true,
    };
    geckoCodes.push(bootToCssCode);
  } else {
    if (geckoCodes[bootCodeIdx].enabled === enable) {
      return;
    }
    geckoCodes[bootCodeIdx].enabled = enable;
  }

  saveCodes(localIni, geckoCodes);

  localIni.save(localIniPath);
}
