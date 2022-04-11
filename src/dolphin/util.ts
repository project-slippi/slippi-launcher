import * as fs from "fs-extra";
import path from "path";

import { setBootToCss } from "./config/config";
import { IniFile } from "./config/iniFile";
import type { DolphinInstallation } from "./install/installation";
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

export async function updateBootToCssCode(installation: DolphinInstallation, options: { enable: boolean }) {
  const userPath = installation.userFolder;
  const sysPath = installation.sysFolder;

  await Promise.all([fs.ensureDir(userPath), fs.ensureDir(sysPath)]);

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
