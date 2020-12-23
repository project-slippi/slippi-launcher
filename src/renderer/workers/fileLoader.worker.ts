import path from "path";
import * as fs from "fs-extra";
import { FileLoadResult, FileResult } from "common/replayBrowser";
import { delay } from "common/utils";

class FileLoader {
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
      const game = processGame(dirent.name, folder);
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

const fileLoader = new FileLoader();

function fibonacci(num: number): number {
  if (num <= 1) return 1;

  return fibonacci(num - 1) + fibonacci(num - 2);
}

export async function loadFolder(
  folder: string,
  callback: (current: number, total: number) => void
): Promise<FileLoadResult> {
  return fileLoader.loadFolder(folder, callback);
}

export async function abortFolderLoad(): Promise<void> {
  return fileLoader.abort();
}

function processGame(filename: string, folder: string): FileResult {
  // Simulate file processing
  const fibRes = fibonacci(35);
  console.log(`Fib 35 is ${fibRes}`);
  // console.log(`Processing file: ${filename} in folder: ${folder}`);
  const result: FileResult = {
    name: filename,
    fullPath: path.join(folder, filename),
    hasError: true,
    startTime: null,
    lastFrame: null,
  };
  return result;
}

/*
function processGame(filename: string, folder: string): FileResult {
  const result: FileResult = {
    name: filename,
    fullPath: path.join(folder, filename),
    hasError: false,
    startTime: null,
    lastFrame: null,
    settings: null,
    metadata: null,
  };

  try {
    const game = new SlippiGame(result.fullPath);

    // Preload settings
    const settings = game.getSettings();
    result.settings = settings;
    if (_.isEmpty(settings.players)) {
      throw new Error("Game settings could not be properly loaded.");
    }

    // Preload metadata
    const metadata = game.getMetadata();
    result.metadata = metadata;
    if (metadata && metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame;
    }

    const startAtTime = fileToDateAndTime(
      metadata.startAt,
      filename,
      result.fullPath
    );
    if (startAtTime) {
      result.startTime = startAtTime.toISOString();
    }
  } catch (err) {
    log.error(err);
    result.hasError = true;
  }

  return result;
}
*/
