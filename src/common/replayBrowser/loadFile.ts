import { GameStartType, MetadataType, SlippiGame } from "@slippi/slippi-js";
import _ from "lodash";

import { fileToDateAndTime } from "../time";
import { FileDetails, FileHeader } from "./types";

export async function loadFiles(
  fileHeaders: FileHeader[],
  callback: (path: string, details: FileDetails) => void,
  errorCallback: (path: string, err: Error) => void,
): Promise<void> {
  for (const header of fileHeaders) {
    try {
      callback(header.fullPath, await loadFile(header));
    } catch (err) {
      errorCallback(header.fullPath, err);
    }
  }
}

async function loadFile(fileHeader: FileHeader): Promise<FileDetails> {
  const game = new SlippiGame(fileHeader.fullPath);
  // Load settings
  const settings: GameStartType | null = game.getSettings();
  if (!settings || _.isEmpty(settings.players)) {
    throw new Error("Game settings could not be properly loaded.");
  }

  const details: FileDetails = {
    settings,
    startTime: null,
    lastFrame: null,
    metadata: null,
  };

  // Load metadata
  const metadata: MetadataType | null = game.getMetadata();
  if (metadata) {
    details.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      details.lastFrame = metadata.lastFrame;
    }
  }

  const startAtTime = fileToDateAndTime(metadata ? metadata.startAt : null, fileHeader);

  if (startAtTime) {
    details.startTime = startAtTime.toISOString();
  }

  return details;
}
