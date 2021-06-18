import { characters as charUtils, stages as stageUtils } from "@slippi/slippi-js";
import { isDevelopment } from "common/constants";
import fs from "fs";
import path from "path";
import url from "url";

import { IniFile } from "./IniFile";

// Fix static folder access in development. For more information see:
// https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
export const getStatic = (val: string): string => {
  if (isDevelopment) {
    return url.resolve(window.location.origin, val);
  }
  // Escape the backslashes or they won't work as CSS background images
  return path.resolve(path.join(__static, val)).replace(/\\/g, "/");
};

export const getCharacterIcon = (characterId: number | null, characterColor: number | null = 0): string => {
  if (characterId === null) {
    return getStatic(`/images/unknown.png`);
  }

  const allColors = charUtils.getCharacterInfo(characterId).colors;
  // Make sure it's a valid color, otherwise use the default color
  const color = characterColor !== null && characterColor <= allColors.length - 1 ? characterColor : 0;
  return getStatic(`/images/characters/${characterId}/${color}/stock.png`);
};

export const getStageImage = (stageId: number): string => {
  let name = "Unknown";
  try {
    name = stageUtils.getStageName(stageId);
  } catch (err) {
    console.error(err);
  }
  const imgSrc = getStatic(`/images/stages/${name}.png`);
  return imgSrc;
};

export const toOrdinal = (i: number): string => {
  const j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
};

/**
 * writes a gecko code by appending it to the end of the [Gecko] section
 * of the ini file
 * @param geckoIniPath - the path to the gecko file
 * @param geckoTitle - the name of the gecko code
 * @param geckoBody - the body of the gecko code
 */
export const writeGecko = async (geckoIniPath: string, geckoTitle: string, geckoBody: string): Promise<boolean> => {
  const geckoName = `$Optional: ${geckoTitle}`;
  const fullGecko = geckoName + "\n" + geckoBody + "\n";
  const geckoIni = new IniFile();
  await geckoIni.load(geckoIniPath, false);
  const enabledLines = geckoIni.getLines("Gecko_Enabled", false);
  enabledLines.push(geckoName);
  geckoIni.setLines("Gecko_Enabled", enabledLines);
  const geckoBodyLines = geckoIni.getLines("Gecko", false);
  geckoBodyLines.push(fullGecko);
  geckoIni.setLines("Gecko", geckoBodyLines);
  geckoIni.save(geckoIniPath);

  return true;
};

/**
 *
 * @param geckoIniPath - the path to the ini file
 * @returns all of the lines of the [Gecko_Enabled] section as a string[]
 */
export const getGeckos = async (geckoIniPath: string): Promise<string[]> => {
  const geckoIni = new IniFile();
  await geckoIni.load(geckoIniPath, false);
  const geckoCodes = geckoIni.getLines("Gecko_Enabled", false);
  return geckoCodes;
};
/**
 * uses checked to determine if gecko codes should be marked as enabled or disabled
 * @param geckoIniPath - the path to the .ini file
 * @param checked - an array specifiying which codes are to be marked as enabled or disabled
 */
export const updateGeckos = async (geckoIniPath: string, checked: number[]): Promise<boolean> => {
  const geckoIni = new IniFile();
  await geckoIni.load(geckoIniPath, false);
  const geckoCodes = geckoIni.getLines("Gecko_Enabled", false);
  checked.forEach((check: number, i: number) => {
    if (check === 1) {
      geckoCodes[i] = "$" + geckoCodes[i].substring(1);
    } else {
      geckoCodes[i] = "-" + geckoCodes[i].substring(1);
    }
  });
  geckoIni.setLines("Gecko_Enabled", geckoCodes);
  geckoIni.save(geckoIniPath);

  return true;
};

/**
 * reads all the files in a directory and returns a string[] of filenames
 * @param directoryName - the name of the directory to be searched
 * @returns the filenames of all the files in the firectory as a string[]
 */
export function getFilesInDir(directoryName: string): string[] {
  const fileNames: string[] = [];
  fs.readdir(directoryName, (error: any, files: string[]) => {
    if (error) {
      return console.log("Unable to scan directory: " + error);
    }
    files.forEach((file: string) => {
      fileNames.push(file);
    });
  });
  return fileNames;
}
