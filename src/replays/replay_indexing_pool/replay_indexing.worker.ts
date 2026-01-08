// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import type { GameStartType, MetadataType } from "@slippi/slippi-js/node";
import { SlippiGame } from "@slippi/slippi-js/node";
import * as fs from "fs-extra";
import type { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

/**
 * Parsed file information returned from worker
 */
export interface ParsedFileInfo {
  filename: string;
  sizeBytes: number;
  birthTime: string | null;
  settings: GameStartType | undefined;
  metadata: MetadataType | undefined;
  winnerIndices: number[];
}

/**
 * Result of parsing a file - either success or error
 */
export interface ParseFileResult {
  success: boolean;
  filename: string;
  data?: ParsedFileInfo;
  error?: string;
}

interface Methods {
  dispose: () => Promise<void>;
  parseReplayFile(folder: string, filename: string): Promise<ParseFileResult>;
  parseReplayFileBatch(folder: string, filenames: string[]): Promise<ParseFileResult[]>;
}

export type WorkerSpec = ModuleMethods & Methods;

const methods: WorkerSpec = {
  async dispose(): Promise<void> {
    // Worker cleanup if needed
  },

  async parseReplayFile(folder: string, filename: string): Promise<ParseFileResult> {
    try {
      const fullPath = `${folder}/${filename}`;

      // Get file stats
      let sizeBytes = 0;
      let birthTime: string | null = null;
      try {
        const fileInfo = await fs.stat(fullPath);
        sizeBytes = fileInfo.size;
        birthTime = fileInfo.birthtime.toISOString();
      } catch (err) {
        // Continue even if stat fails - we'll use defaults
      }

      // Parse the replay file
      const game = new SlippiGame(fullPath);
      const settings = game.getSettings();
      const metadata = game.getMetadata();
      const winnerIndices = game.getWinners().map((winner) => winner.playerIndex);

      return {
        success: true,
        filename,
        data: {
          filename,
          sizeBytes,
          birthTime,
          settings,
          metadata,
          winnerIndices,
        },
      };
    } catch (err) {
      return {
        success: false,
        filename,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async parseReplayFileBatch(folder: string, filenames: string[]): Promise<ParseFileResult[]> {
    const results: ParseFileResult[] = [];

    for (const filename of filenames) {
      const result = await methods.parseReplayFile(folder, filename);
      results.push(result);
    }

    return results;
  },
};

expose(methods);
