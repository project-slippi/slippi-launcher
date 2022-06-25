import { exists } from "@common/exists";
import * as fs from "fs-extra";

import { loadFile } from "./loadFile";
import type { FileLoadResult, FileResult } from "./types";

export async function loadReplays(
  filesToLoad: string[],
  callback?: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  let count = 0;
  const total = filesToLoad.length;

  const fileSizesPromise = Promise.all(
    filesToLoad.map(async (fullPath): Promise<number> => {
      const stat = await fs.stat(fullPath);
      return stat.size;
    }),
  );

  const process = async (path: string) => {
    return new Promise<FileResult | null>((resolve) => {
      setImmediate(async () => {
        try {
          resolve(await loadFile(path));
        } catch (err) {
          resolve(null);
        } finally {
          callback && callback(count++, total);
        }
      });
    });
  };

  const slpGamesPromise = Promise.all(
    filesToLoad.map((fullPath) => {
      return process(fullPath);
    }),
  );

  const [slpGames, fileSizes] = await Promise.all([slpGamesPromise, fileSizesPromise]);
  const files = slpGames.filter(exists);
  const fileErrorCount = filesToLoad.length - files.length;

  return {
    files,
    totalBytes: fileSizes.reduce((acc, size) => acc + size, 0),
    fileErrorCount,
  };
}
