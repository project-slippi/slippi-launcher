import { characters as charUtils, stages as stageUtils } from "@slippi/slippi-js";
import { isDevelopment } from "common/constants";
import path from "path";
import url from "url";

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
