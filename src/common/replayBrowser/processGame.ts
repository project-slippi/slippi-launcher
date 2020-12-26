import _ from "lodash";
import { SlippiGame } from "@slippi/slippi-js";
import path from "path";
import { FileResult } from "./types";
import { fileToDateAndTime } from "../time";

export async function processGame(fullPath: string): Promise<FileResult> {
  const filename = path.basename(fullPath);
  const game = new SlippiGame(fullPath);
  // Load settings
  const settings = game.getSettings();
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
    // stats: null,
    // latestFrame: null,
  };

  // Load metadata
  const metadata = game.getMetadata();
  if (metadata) {
    result.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame;
    }
  }

  const startAtTime = fileToDateAndTime(
    metadata ? metadata.startAt : null,
    filename,
    result.fullPath
  );

  if (startAtTime) {
    result.startTime = startAtTime.toISOString();
  }

  // // Load stats
  // const stats = game.getStats();
  // if (stats) {
  //   result.stats = stats;
  // }

  // // Load latestFrame
  // const latestFrameDetails = game.getLatestFrame(); // TODO this is way too slow to put here...
  // if (latestFrameDetails) {
  //   result.latestFrameDetails = latestFrameDetails;
  // }
  return result;
}
