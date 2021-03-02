import { SlippiGame } from "@slippi/slippi-js";
import { fileToDateAndTime } from "common/time";
import { FileResult } from "common/types";
import _ from "lodash";
import path from "path";

export async function loadFile(fullPath: string): Promise<FileResult> {
  const game = new SlippiGame(fullPath);
  const filename = path.basename(fullPath);
  const folder = path.dirname(fullPath);
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
    stats: null,
    playerCount: settings.players.length,
    player1: null,
    player2: null,
    player3: null,
    player4: null,
    folder: folder,
  };
  //
  // Load metadata
  const metadata = game.getMetadata();
  if (metadata) {
    result.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame!;
    }

    // if (metadata.players) {
    //   const players = metadata.players;
    //   result.player1 = "0" in players ? players["0"].names.code : null;
    //   result.player2 = "1" in players ? players["1"].names.code : null;
    //   result.player3 = "2" in players ? players["2"].names.code : null;
    //   result.player4 = "3" in players ? players["4"].names.code : null;
    // }
  }

  const startAtTime = fileToDateAndTime(metadata ? metadata.startAt : null, filename, result.fullPath);

  if (startAtTime) {
    result.startTime = startAtTime.toISOString();
  }

  const stats = game.getStats();
  if (stats) {
    result.stats = stats;
  }

  return result;
}
