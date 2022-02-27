import { isLinux, isWindows } from "@common/constants";
import { characters as charUtils } from "@slippi/slippi-js";

const getAssetPath = window.electron.common.getAssetPath;

export const getCharacterIcon = (characterId: number | null, characterColor: number | null = 0): string => {
  if (characterId !== null) {
    const characterInfo = charUtils.getCharacterInfo(characterId);
    if (characterInfo.id !== charUtils.UnknownCharacter.id) {
      const allColors = characterInfo.colors;
      // Make sure it's a valid color, otherwise use the default color
      const color = characterColor !== null && characterColor <= allColors.length - 1 ? characterColor : 0;
      return getAssetPath(`/images/characters/${characterId}/${color}/stock.png`);
    }
  }
  return getAssetPath(`/images/unknown.png`);
};

export const getStageImage = (stageId: number): string => {
  return getAssetPath(`/images/stages/${stageId}.png`);
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

export const handleDolphinExitCode = (exitCode: number | null): string | null => {
  if (exitCode === null || exitCode === 0) {
    return null;
  }

  let err: string | null = null;

  if (isWindows) {
    err = handleWindowsExitCode(exitCode);
  }

  if (isLinux) {
    err = handleLinuxExitCode(exitCode);
  }

  return err;
};

const handleWindowsExitCode = (exitCode: number): string | null => {
  switch (exitCode) {
    case 0x3: {
      // returned when selecting update in game
      return null;
    }
    case 0xc0000135:
    case 0xc0000409:
    case 0xc000007b: {
      return "Required DLLs for launching Dolphin are missing. Check the Help section in the settings page to fix this issue.";
    }
    case 0xc0000005: {
      return "Install the latest Windows update available and then restart your computer.";
    }
    default: {
      return `Dolphin exited with error code: 0x${exitCode.toString(16)}.
      Please screenshot this and post it in a support channel in the Slippi Discord for assistance.`;
    }
  }
};

const handleLinuxExitCode = (exitCode: number): string => {
  switch (exitCode) {
    case 0x7f: {
      return "Required libraries for launching Dolphin may be missing. Check the Help section in the settings page for guidance. Post in the Slippi Discord's linux-support channel for further assistance if needed.";
    }
    default: {
      return `Dolphin exited with error code: 0x${exitCode.toString(16)}.
      Please screenshot this and post it in a support channel in the Slippi Discord for assistance.`;
    }
  }
};
