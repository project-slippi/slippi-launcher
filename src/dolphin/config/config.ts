import { defaultAppSettings } from "@settings/defaultSettings";

import type { GeckoCode } from "./geckoCode";
import { loadGeckoCodes, setCodes } from "./geckoCode";
import type { IniFile } from "./iniFile";

export type SyncedDolphinSettings = {
  useMonthlySubfolders: boolean;
  replayPath: string;
  enableJukebox: boolean;
};

export async function addGamePath(iniFile: IniFile, gameDir: string): Promise<void> {
  const generalSection = iniFile.getOrCreateSection("General");
  const numPaths = generalSection.get("ISOPaths", "0");
  generalSection.set("ISOPaths", numPaths !== "0" ? numPaths : "1");
  generalSection.set("ISOPath0", gameDir);
  await iniFile.save();
}

export async function setSlippiMainlineSettings(
  iniFile: IniFile,
  options: Partial<SyncedDolphinSettings>,
): Promise<void> {
  const useMonthlySubfolders = options.useMonthlySubfolders ? "True" : "False";
  const enableJukebox = options.enableJukebox ? "True" : "False";
  const slippiSection = iniFile.getOrCreateSection("Slippi");

  if (options.replayPath !== undefined) {
    slippiSection.set("ReplayDir", options.replayPath);
  }
  if (options.useMonthlySubfolders !== undefined) {
    slippiSection.set("ReplayMonthlyFolders", useMonthlySubfolders);
  }
  if (options.enableJukebox !== undefined) {
    slippiSection.set("EnableJukebox", enableJukebox);
  }

  await iniFile.save();
}

export async function setSlippiIshiiSettings(iniFile: IniFile, options: Partial<SyncedDolphinSettings>): Promise<void> {
  const useMonthlySubfolders = options.useMonthlySubfolders ? "True" : "False";
  const enableJukebox = options.enableJukebox ? "True" : "False";
  const coreSection = iniFile.getOrCreateSection("Core");
  if (options.replayPath !== undefined) {
    coreSection.set("SlippiReplayDir", options.replayPath);
  }
  if (options.useMonthlySubfolders !== undefined) {
    coreSection.set("SlippiReplayMonthFolders", useMonthlySubfolders);
  }
  if (options.enableJukebox !== undefined) {
    coreSection.set("SlippiJukeboxEnabled", enableJukebox);
  }
  await iniFile.save();
}

export async function getSlippiMainlineSettings(iniFile: IniFile): Promise<SyncedDolphinSettings> {
  const slippiSection = iniFile.getOrCreateSection("Slippi");

  const replayPath = slippiSection.get("ReplayDir", defaultAppSettings.settings.rootSlpPath);
  const useMonthlySubfolders = slippiSection.get("ReplayMonthlyFolders", "True") === "True";
  const enableJukebox = slippiSection.get("EnableJukebox", "True") === "True";

  return { useMonthlySubfolders, replayPath, enableJukebox };
}

export async function getSlippiIshiiSettings(iniFile: IniFile): Promise<SyncedDolphinSettings> {
  const coreSection = iniFile.getOrCreateSection("Core");

  const replayPath = coreSection.get("SlippiReplayDir", defaultAppSettings.settings.rootSlpPath);
  const useMonthlySubfolders = coreSection.get("SlippiReplayMonthFolders", "False") === "True";
  const enableJukebox = coreSection.get("SlippiJukeboxEnabled", "True") === "True";

  return { useMonthlySubfolders, replayPath, enableJukebox };
}

export async function setBootToCss(globalIni: IniFile, localIni: IniFile, enable: boolean): Promise<void> {
  const geckoCodes = loadGeckoCodes(globalIni, localIni);
  const bootCode = geckoCodes.find((code) => code.name === "Boot to CSS");
  if (bootCode) {
    if (bootCode.enabled === enable) {
      return;
    } else {
      bootCode.enabled = enable;
    }
  } else {
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
  }

  setCodes(localIni, geckoCodes);

  await localIni.save();
}
