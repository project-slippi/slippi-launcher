import { GameStartType, MetadataType, SlippiGame } from "@slippi/slippi-js";
import { fileToDateAndTime } from "common/time";
import _ from "lodash";
import path from "path";

import { FileResult } from "./types";

export async function loadFile(fullPath: string): Promise<FileResult> {
  const filename = path.basename(fullPath);
  const game = new SlippiGame(fullPath);
  // Load settings
  const settings: GameStartType | null = game.getSettings();
  if (!settings || _.isEmpty(settings.players)) {
    throw new Error("Game settings could not be properly loaded.");
  }

  const result: FileResult = {
    name: filename,
    fullPath,
    settings,
    startTime: null,
    lastFrame: null,
    metadata: null,
  };

  // Load metadata
  const metadata: MetadataType | null = game.getMetadata();
  if (metadata) {
    result.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame;
    }
  }

  const startAtTime = fileToDateAndTime(metadata ? metadata.startAt : null, filename, result.fullPath);

  if (startAtTime) {
    result.startTime = startAtTime.toISOString();
  }

  return result;
}
