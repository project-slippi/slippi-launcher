import log from "electron-log";
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
        fileErrorCount: 0,
      };
    }

    const results = await fs.readdir(folder, { withFileTypes: true });
    const slpFiles = results.filter(
      (dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp"
    );
    const total = slpFiles.length;
    const slpGames: FileResult[] = [];
    let fileErrorCount = 0;
    for (const [i, dirent] of slpFiles.entries()) {
      if (this.stopRequested) {
        break;
      }

      const fullPath = path.resolve(folder, dirent.name);
      try {
        const game = await processGame(fullPath);
        callback(i + 1, total);
        slpGames.push(game);
      } catch (err) {
        log.error(`Error processing ${fullPath}: ${err}`);
        fileErrorCount += 1;
      }

      // Add a bit of time delay so the worker thread can handle the stop signal
      await delay(5);
    }

    this.processing = false;
    return {
      aborted: this.stopRequested,
      files: slpGames,
      fileErrorCount,
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
