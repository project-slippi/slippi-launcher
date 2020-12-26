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

    let fileErrorCount = 0;
    let fileValidCount = 0;
    callback(0, total);

    const process = async (path: string) => {
      return new Promise((resolve) => {
        setImmediate(async () => {
          try {
            const res = await processGame(path);
            fileValidCount += 1;
            callback(fileValidCount, total);
            resolve(res);
          } catch (err) {
            fileErrorCount += 1;
            resolve(null);
          }
        });
      });
    };

    const slpGames = (
      await Promise.all(
        slpFiles.map((dirent) => {
          const fullPath = path.resolve(folder, dirent.name);
          return process(fullPath);
        })
      )
    ).filter((g) => g !== null) as FileResult[];

    // Indicate that loading is complete
    callback(total, total);

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
