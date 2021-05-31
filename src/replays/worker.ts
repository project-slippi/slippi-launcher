// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import { SlippiGame, StatsType } from "@slippi/slippi-js";
import isEmpty from "lodash/isEmpty";
import { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

import { loadFile } from "./loadFile";
import { FileResult } from "./types";

export interface Methods {
  loadReplayFile(fullPath: string): Promise<FileResult | null>;
  calculateGameStats(fullPath: string): Promise<StatsType>;
  destroyWorker: () => Promise<void>;
}

export type WorkerSpec = ModuleMethods & Methods;

const methods: WorkerSpec = {
  async loadReplayFile(fullPath: string): Promise<FileResult | null> {
    try {
      return await loadFile(fullPath);
    } catch (err) {
      return null; // File load failed, should be filtered
    }
  },
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },
  async calculateGameStats(fullPath: string): Promise<StatsType> {
    // For a valid SLP game, at the very least we should have valid settings
    const game = new SlippiGame(fullPath);
    const settings = game.getSettings();
    if (!settings || isEmpty(settings.players)) {
      throw new Error("Game settings could not be properly loaded.");
    }

    if (settings.players.length !== 2) {
      throw new Error("Stats can only be calculated for 1v1s.");
    }

    return game.getStats();
  },
};

expose(methods);
