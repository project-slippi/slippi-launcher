import { SlippiGame, StatsType } from "@slippi/slippi-js";
import _ from "lodash";

export async function calculateGameStats(fullPath: string): Promise<StatsType> {
  // For a valid SLP game, at the very least we should have valid settings
  const game = new SlippiGame(fullPath);
  const settings = game.getSettings();
  if (!settings || _.isEmpty(settings.players)) {
    throw new Error("Game settings could not be properly loaded.");
  }

  if (settings.players.length !== 2) {
    throw new Error("Stats can only be calculated for 1v1s.");
  }

  return game.getStats();
}
