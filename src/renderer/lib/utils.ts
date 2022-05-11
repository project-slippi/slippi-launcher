import { characters as charUtils, stages as stageUtils } from "@slippi/slippi-js";

import unknownCharacterIcon from "@/styles/images/unknown.png";

const characterIcons = require.context("../styles/images/characters", true);
const stageIcons = require.context("../styles/images/stages");

export const getCharacterIcon = (characterId: number | null, characterColor: number | null = 0): string => {
  if (characterId !== null) {
    const characterInfo = charUtils.getCharacterInfo(characterId);
    if (characterInfo.id !== charUtils.UnknownCharacter.id) {
      const allColors = characterInfo.colors;
      // Make sure it's a valid color, otherwise use the default color
      const color = characterColor !== null && characterColor <= allColors.length - 1 ? characterColor : 0;
      try {
        return characterIcons(`./${characterId}/${color}/stock.png`);
      } catch (err) {
        console.warn(`Failed to find stock icon for character ID ${characterId} and color ${color}.`);
      }
    }
  }
  return unknownCharacterIcon;
};

export const getStageImage = (stageId: number): string => {
  const stageInfo = stageUtils.getStageInfo(stageId);
  if (stageInfo.id !== stageUtils.UnknownStage.id) {
    try {
      return stageIcons(`./${stageId}.png`);
    } catch (err) {
      console.warn(`Failed to find stage image for stage ID ${stageId}`);
    }
  }
  return "";
};

export const toOrdinal = (i: number): string => {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
};

// Converts number of bytes into a human readable format.
// Based on code available from:
// https://coderrocketfuel.com/article/get-the-total-size-of-all-files-in-a-directory-using-node-js
export const humanReadableBytes = (bytes: number): string => {
  const sizes = ["bytes", "KB", "MB", "GB", "TB"];
  if (bytes > 0) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  return `0 ${sizes[0]}`;
};
