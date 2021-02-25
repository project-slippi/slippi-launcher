import * as fs from "fs-extra";
import path from "path";

import { loadFile } from "./loadFile";
import { FileLoadResult, FileResult } from "./types";

export async function loadFolder(
  loadedFiles: string[],
  folder: string,
  callback: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  // If the folder does not exist, return empty
  if (!(await fs.pathExists(folder))) {
    return {
      files: [],
      fileErrorCount: 0,
      filesToDelete: [],
    };
  }

  const results = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = results.filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp");
  const filtered = slpFiles.filter((dirent) => !loadedFiles.includes(path.resolve(folder, dirent.name)));
  const total = filtered.length;
  const paths = slpFiles.map((d) => path.resolve(folder, d.name));
  const toDelete = loadedFiles.filter((file) => !paths.includes(file));
  console.log(
    `found ${slpFiles.length} files in ${folder}, ${total} are new. ${toDelete.length} will be removed from the DB`,
  );
  if (total === 0) {
    return {
      files: [],
      fileErrorCount: 0,
      filesToDelete: toDelete,
    };
  }

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
          console.log(err);
          fileErrorCount += 1;
          resolve(null);
        }
      });
    });
  };

  const slpGames = (
    await Promise.all(
      filtered.map((dirent) => {
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
    filesToDelete: toDelete,
  };
}
