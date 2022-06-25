import { exists } from "@common/exists";
import * as fs from "fs-extra";

import { loadFile } from "./loadFile";
import type { FileLoadResult } from "./types";

export async function loadReplays(
  filesToLoad: string[],
  callback?: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  let count = 0;
  const fileSizesPromise = Promise.all(
    filesToLoad.map(async (fullPath): Promise<number> => {
      const stat = await fs.stat(fullPath);
      return stat.size;
    }),
  );

  const slpGamesPromise = Promise.all(
    filesToLoad.map(async (file) => {
      try {
        const res = await loadFile(file);
        callback && callback(count++, filesToLoad.length);
        return res;
      } catch (err) {
        return null;
      }
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
