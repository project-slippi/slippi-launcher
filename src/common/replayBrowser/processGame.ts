import log from "electron-log";
import _ from "lodash";
import { SlippiGame } from "@slippi/slippi-js";
import path from "path";
import { FileResult } from "./types";
import { fileToDateAndTime } from "../time";

export function processGame(fullPath: string): FileResult {
  const filename = path.basename(fullPath);

  const result: FileResult = {
    name: filename,
    fullPath: fullPath,
    hasError: false,
    startTime: null,
    lastFrame: null,
    settings: null,
    metadata: null,
  };

  try {
    const game = new SlippiGame(result.fullPath);

    // Load settings
    const settings = game.getSettings();
    result.settings = settings;
    if (_.isEmpty(settings.players)) {
      throw new Error("Game settings could not be properly loaded.");
    }

    // Load metadata
    const metadata = game.getMetadata();
    if (metadata) {
      result.metadata = metadata;

      if (metadata && metadata.lastFrame !== undefined) {
        result.lastFrame = metadata.lastFrame;
      }

      const startAtTime = fileToDateAndTime(
        metadata.startAt,
        filename,
        result.fullPath
      );

      if (startAtTime) {
        result.startTime = startAtTime.toISOString();
      }
    }
  } catch (err) {
    log.error(`Error processing: ${fullPath}: ${err}`);
    result.hasError = true;
  }

  return result;
}
