import { defaultAppSettings } from "@settings/default_settings";

import type { GeckoCode } from "./gecko_code";
import { loadGeckoCodes, setCodes } from "./gecko_code";
import type { IniFile } from "./ini_file";

export type SyncedDolphinSettings = {
  enableNetplayReplays: boolean;
  enableMonthlySubfolders: boolean;
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
  const enableNetplayReplays = convertBooleanToIniVal(options.enableNetplayReplays);
  const enableMonthlySubfolders = convertBooleanToIniVal(options.enableMonthlySubfolders);
  const enableJukebox = convertBooleanToIniVal(options.enableJukebox);
  const slippiSection = iniFile.getOrCreateSection("Slippi");

  if (options.replayPath !== undefined) {
    slippiSection.set("ReplayDir", options.replayPath);
  }
  if (options.enableNetplayReplays !== undefined) {
    slippiSection.set("SaveReplays", enableNetplayReplays);
  }
  if (options.enableMonthlySubfolders !== undefined) {
    slippiSection.set("ReplayMonthlyFolders", enableMonthlySubfolders);
  }
  if (options.enableJukebox !== undefined) {
    slippiSection.set("EnableJukebox", enableJukebox);
  }

  await iniFile.save();
}

export async function setSlippiIshiiSettings(iniFile: IniFile, options: Partial<SyncedDolphinSettings>): Promise<void> {
  const enableNetplayReplays = convertBooleanToIniVal(options.enableNetplayReplays);
  const enableMonthlySubfolders = convertBooleanToIniVal(options.enableMonthlySubfolders);
  const enableJukebox = convertBooleanToIniVal(options.enableJukebox);

  const coreSection = iniFile.getOrCreateSection("Core");
  if (options.enableNetplayReplays !== undefined) {
    coreSection.set("SlippiSaveReplays", enableNetplayReplays);
  }
  if (options.replayPath !== undefined) {
    coreSection.set("SlippiReplayDir", options.replayPath);
  }
  if (options.enableMonthlySubfolders !== undefined) {
    coreSection.set("SlippiReplayMonthFolders", enableMonthlySubfolders);
  }
  if (options.enableJukebox !== undefined) {
    coreSection.set("SlippiJukeboxEnabled", enableJukebox);
  }
  await iniFile.save();
}

export async function getSlippiMainlineSettings(iniFile: IniFile): Promise<SyncedDolphinSettings> {
  const slippiSection = iniFile.getOrCreateSection("Slippi");

  const enableNetplayReplays = slippiSection.get("SaveReplays", "True") === "True";
  const replayPath = slippiSection.get("ReplayDir", defaultAppSettings.settings.rootSlpPath);
  const enableMonthlySubfolders = slippiSection.get("ReplayMonthlyFolders", "True") === "True";
  const enableJukebox = slippiSection.get("EnableJukebox", "True") === "True";

  return { enableNetplayReplays, enableMonthlySubfolders, replayPath, enableJukebox };
}

export async function getSlippiIshiiSettings(iniFile: IniFile): Promise<SyncedDolphinSettings> {
  const coreSection = iniFile.getOrCreateSection("Core");

  const enableNetplayReplays = coreSection.get("SlippiSaveReplays", "True") === "True";
  const replayPath = coreSection.get("SlippiReplayDir", defaultAppSettings.settings.rootSlpPath);
  const enableMonthlySubfolders = coreSection.get("SlippiReplayMonthFolders", "False") === "True";
  const enableJukebox = coreSection.get("SlippiJukeboxEnabled", "True") === "True";

  return { enableNetplayReplays, enableMonthlySubfolders, replayPath, enableJukebox };
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

function convertBooleanToIniVal(value?: boolean): string {
  return value ? "True" : "False";
}
