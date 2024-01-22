import * as fs from "fs-extra";
import path from "path";

import { setBootToCss } from "./config/config";
import type { GeckoCode } from "./config/gecko_code";
import { loadGeckoCodes, setCodes } from "./config/gecko_code";
import { IniFile } from "./config/ini_file";
import type { DolphinInstallation } from "./types";
import { DolphinLaunchType } from "./types";

export async function findDolphinExecutable(type: DolphinLaunchType, dolphinPath: string): Promise<string> {
  // Make sure the directory actually exists
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
        const isAppimage = filename.startsWith(appimagePrefix) && filename.endsWith("AppImage");
        return isAppimage || filename.endsWith("dolphin-emu");
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

export async function updateBootToCssCode(installation: DolphinInstallation, options: { enable: boolean }) {
  const { userFolder, sysFolder } = installation;

  await Promise.all([fs.ensureDir(userFolder), fs.ensureDir(sysFolder)]);

  // Update vanilla ISO configs
  await Promise.all(
    ["GALE01", "GALJ01"].map(async (id) => {
      const globalIniPath = path.join(sysFolder, "GameSettings", `${id}r2.ini`);
      const localIniPath = path.join(userFolder, "GameSettings", `${id}.ini`);
      const globalIni = await IniFile.init(globalIniPath);
      const localIni = await IniFile.init(localIniPath);
      return setBootToCss(globalIni, localIni, options.enable);
    }),
  );
}

export async function fetchGeckoCodes(installation: DolphinInstallation) {
  const { userFolder, sysFolder } = installation;

  await Promise.all([fs.ensureDir(userFolder), fs.ensureDir(sysFolder)]);
  const globalIniPath = path.join(sysFolder, "GameSettings", `GALE01r2.ini`);
  const localIniPath = path.join(userFolder, "GameSettings", `GALE01.ini`);
  const globalIni = await IniFile.init(globalIniPath);
  const localIni = await IniFile.init(localIniPath);

  return loadGeckoCodes(globalIni, localIni);
}

export async function saveGeckoCodes(installation: DolphinInstallation, geckoCodes: GeckoCode[]) {
  const { userFolder, sysFolder } = installation;

  await Promise.all([fs.ensureDir(userFolder), fs.ensureDir(sysFolder)]);
  const localIniPath = path.join(userFolder, "GameSettings", `GALE01.ini`);
  const localIni = await IniFile.init(localIniPath);

  const localCodes = geckoCodes;
  setCodes(localIni, localCodes);
  return await localIni.save();
}
