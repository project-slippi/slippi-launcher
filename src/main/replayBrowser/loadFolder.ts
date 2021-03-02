import * as fs from "fs-extra";
import path from "path";

import { FileLoadResult, FileResult } from "../../common/types";
import { loadFile } from "./loadFile";

export async function loadFolder(
  folder: string,
  callback: (current: number, total: number) => void = () => null,
): Promise<FileLoadResult> {
  // If the folder does not exist, return empty
  if (!(await fs.pathExists(folder))) {
    return {
      files: [],
      fileErrorCount: 0,
    };
  }

  const results = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = results.filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp");
  const total = slpFiles.length;

  let fileErrorCount = 0;
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
      }),
    )
  ).filter((g) => g !== null) as FileResult[];

  // Indicate that loading is complete
  callback(total, total);

  return {
    files: slpGames,
    fileErrorCount,
  };
}
