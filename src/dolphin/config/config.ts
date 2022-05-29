import type { GeckoCode } from "./geckoCode";
import { loadGeckoCodes, setCodes } from "./geckoCode";
import type { IniFile } from "./iniFile";

export async function addGamePath(iniFile: IniFile, gameDir: string): Promise<void> {
  const generalSection = iniFile.getOrCreateSection("General");
  const numPaths = generalSection.get("ISOPaths", "0");
  generalSection.set("ISOPaths", numPaths !== "0" ? numPaths : "1");
  generalSection.set("ISOPath0", gameDir);
  await iniFile.save();
}

export async function setSlippiSettings(
  iniFile: IniFile,
  options: Partial<{
    useMonthlySubfolders: boolean;
    replayPath: string;
  }>,
): Promise<void> {
  const useMonthlySubfolders = options.useMonthlySubfolders ? "True" : "False";
  const coreSection = iniFile.getOrCreateSection("Core");
  if (options.replayPath !== undefined) {
    coreSection.set("SlippiReplayDir", options.replayPath);
  }
  if (options.useMonthlySubfolders !== undefined) {
    coreSection.set("SlippiReplayMonthFolders", useMonthlySubfolders);
  }
  await iniFile.save();
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
