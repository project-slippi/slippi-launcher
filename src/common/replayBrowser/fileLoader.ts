import path from "path";
import * as fs from "fs-extra";
import { FileLoadResult, FileResult } from "./types";
import { delay } from "../utils";
import { processGame } from "./processGame";

export class FileLoader {
  private processing = false;
  private stopRequested = false;

  public async loadFolder(
    folder: string,
    callback: (current: number, total: number) => void
  ): Promise<FileLoadResult> {
    if (this.processing) {
      // Kill the existing folder load
      await this.abort();
    }

    // Reset state
    this.processing = true;
    this.stopRequested = false;

    // If the folder does not exist, return empty
    if (!(await fs.pathExists(folder))) {
      return {
        aborted: false,
        files: [],
      };
    }

    const results = await fs.readdir(folder, { withFileTypes: true });
    const slpFiles = results.filter(
      (dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp"
    );
    const total = slpFiles.length;
    const slpGames: FileResult[] = [];
    for (const [i, dirent] of slpFiles.entries()) {
      if (this.stopRequested) {
        break;
      }
      const fullPath = path.resolve(folder, dirent.name);
      const game = processGame(fullPath);
      callback(i + 1, total);
      slpGames.push(game);

      // Add a bit of time delay so the worker thread can handle the stop signal
      await delay(5);
    }

    this.processing = false;
    return {
      aborted: this.stopRequested,
      files: slpGames,
    };
  }

  public async abort() {
    this.stopRequested = true;
    while (this.processing) {
      // Wait till processing is complete
      await delay(50);
    }
  }
}
