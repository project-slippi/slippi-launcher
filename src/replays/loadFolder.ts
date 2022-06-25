import { exists } from "@common/exists";

import { loadFile } from "./loadFile";
import type { FileLoadResult, FileResult } from "./types";

export async function loadReplays(
  filesToLoad: string[],
  callback?: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  let count = 0;
  const total = filesToLoad.length;

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

  const slpGames = await Promise.all(
    filesToLoad.map((fullPath) => {
      return process(fullPath);
    }),
  );

  return {
    files: slpGames.filter(exists),
  };
}
