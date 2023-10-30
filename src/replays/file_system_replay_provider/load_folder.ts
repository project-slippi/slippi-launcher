import { exists } from "@common/exists";
import * as fs from "fs-extra";
import path from "path";

import type { FileLoadResult, FileResult } from "../types";
import { loadFile } from "./load_file";

export async function loadFolder(
  folder: string,
  callback: (current: number, total: number) => void = () => null,
): Promise<FileLoadResult> {
  // If the folder does not exist, return empty
  if (!(await fs.pathExists(folder))) {
    return {
      files: [],
      fileErrorCount: 0,
      totalBytes: 0,
    };
  }

  const results = await fs.readdir(folder, { withFileTypes: true });
  const fullSlpPaths = results
    .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
    .map((dirent) => path.resolve(folder, dirent.name));

  // Ensure we actually have files to process
  const total = fullSlpPaths.length;
  if (total === 0) {
    return {
      files: [],
      fileErrorCount: 0,
      totalBytes: 0,
    };
  }

  let fileValidCount = 0;
  callback(0, total);

  const process = async (path: string) => {
    return new Promise<FileResult | null>((resolve) => {
      setImmediate(async () => {
        try {
          const res = await loadFile(path);
          fileValidCount += 1;
          callback(fileValidCount, total);
          resolve(res);
        } catch (err) {
          resolve(null);
        }
      });
    });
  };

  const slpGamesPromise = Promise.all(
    fullSlpPaths.map((fullPath) => {
      return process(fullPath);
    }),
  );
  const fileSizesPromise = Promise.all(
    fullSlpPaths.map(async (fullPath): Promise<number> => {
      const stat = await fs.stat(fullPath);
      return stat.size;
    }),
  );

  const [slpGames, fileSizes] = await Promise.all([slpGamesPromise, fileSizesPromise]);

  // Indicate that loading is complete
  callback(total, total);

  return {
    files: slpGames.filter(exists),
    fileErrorCount: total - fileValidCount,
    totalBytes: fileSizes.reduce((acc, size) => acc + size, 0),
  };
}
