import { GameStartType, MetadataType, SlippiGame } from "@slippi/slippi-js";
import _ from "lodash";
import path from "path";

import { fileToDateAndTime } from "../time";
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
    stats: null,
    playerCount: settings.players.length,
    player1: null,
    player2: null,
    player3: null,
    player4: null,
    folder: path.dirname(fullPath),
  };

  // Load metadata
  const metadata: MetadataType | null = game.getMetadata();
  if (metadata) {
    result.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame;
    }

    if (metadata.players) {
      const players = metadata.players;
      result.player1 = "0" in players ? players["0"].names.code : null;
      result.player2 = "1" in players ? players["1"].names.code : null;
      result.player3 = "2" in players ? players["2"].names.code : null;
      result.player4 = "3" in players ? players["4"].names.code : null;
    }
  }

  const startAtTime = fileToDateAndTime(metadata ? metadata.startAt : null, filename, result.fullPath);

  if (startAtTime) {
    result.startTime = startAtTime.toISOString();
  }

  return result;
}
