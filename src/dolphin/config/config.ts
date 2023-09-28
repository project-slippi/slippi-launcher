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

export async function setSlippiSettings(
  iniFile: IniFile,
  options: Partial<SyncedDolphinSettings>,
  useBeta: boolean,
): Promise<void> {
  const useMonthlySubfolders = options.useMonthlySubfolders ? "True" : "False";
  const enableJukebox = options.enableJukebox ? "True" : "False";
  const sectionName = useBeta ? "Slippi" : "Core";
  const section = iniFile.getOrCreateSection(sectionName);

  if (useBeta) {
    if (options.replayPath !== undefined) {
      section.set("ReplayDir", options.replayPath);
    }
    if (options.useMonthlySubfolders !== undefined) {
      section.set("ReplayMonthlyFolders", useMonthlySubfolders);
    }
    if (options.enableJukebox !== undefined) {
      section.set("EnableJukebox", enableJukebox);
    }
  } else {
    if (options.replayPath !== undefined) {
      section.set("SlippiReplayDir", options.replayPath);
    }
    if (options.useMonthlySubfolders !== undefined) {
      section.set("SlippiReplayMonthFolders", useMonthlySubfolders);
    }
    if (options.enableJukebox !== undefined) {
      section.set("SlippiJukeboxEnabled", enableJukebox);
    }
  }

  await iniFile.save();
}

export async function getSlippiSettings(iniFile: IniFile, useBeta: boolean): Promise<SyncedDolphinSettings> {
  const sectionName = useBeta ? "Slippi" : "Core";
  const section = iniFile.getOrCreateSection(sectionName);

  if (useBeta) {
    const replayPath = section.get("ReplayDir", defaultAppSettings.settings.rootSlpPath);
    const useMonthlySubfolders = section.get("ReplayMonthlyFolders", "False") === "True";
    const enableJukebox = section.get("EnableJukebox", "True") === "True";

    return { useMonthlySubfolders, replayPath, enableJukebox };
  }

  const replayPath = section.get("SlippiReplayDir", defaultAppSettings.settings.rootSlpPath);
  const useMonthlySubfolders = section.get("SlippiReplayMonthFolders", "False") === "True";
  const enableJukebox = section.get("SlippiJukeboxEnabled", "True") === "True";

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
