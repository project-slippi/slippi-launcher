import { exists } from "@common/exists";

import { loadFile } from "./loadFile";
import type { FileLoadResult, FileResult } from "./types";

export async function loadReplays(
  filesToLoad: string[],
  callback?: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  let count = 0;

  const process = async (path: string) => {
    return new Promise<FileResult | null>((resolve) => {
      setImmediate(() => {
        loadFile(path)
          .then(resolve)
          .catch(() => resolve(null))
          .finally(() => {
            callback && callback(count++, filesToLoad.length);
          });
      });
    });
  };

  const slpGames = await Promise.all(filesToLoad.map((fullPath) => process(fullPath)));

  return {
    files: slpGames.filter(exists),
  };
}
