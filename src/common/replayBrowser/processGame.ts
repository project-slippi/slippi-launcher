import _ from "lodash";
import { SlippiGame } from "@slippi/slippi-js";
import path from "path";
import { FileResult } from "./types";
import { fileToDateAndTime } from "../time";

export async function processGame(fullPath: string): Promise<FileResult> {
  const filename = path.basename(fullPath);

  const result: FileResult = {
    name: filename,
    fullPath,
    startTime: null,
    lastFrame: null,
    settings: null,
    metadata: null,
  };

  const game = new SlippiGame(fullPath);

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

  return result;
}
