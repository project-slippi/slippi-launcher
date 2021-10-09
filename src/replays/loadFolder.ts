import * as fs from "fs-extra";
import path from "path";

import { FolderLoadResult, FileHeader } from "./types";

export async function loadFolder(
  folder: string,
  callback: (current: number, total: number) => void = () => null,
): Promise<FolderLoadResult> {
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

  const process = async (fullPath: string) => {
    return new Promise<FileHeader | null>((resolve) => {
      setImmediate(async () => {
        try {
          const result: FileHeader = {
            name: path.basename(fullPath),
            fullPath: fullPath,
            birthtimeMs: (await fs.stat(fullPath)).birthtimeMs,
          };
          fileValidCount++;
          callback(fileValidCount, total);
          resolve(result);
        } catch (err) {
          fileErrorCount++;
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
  ).filter((g) => g !== null) as FileHeader[];

  // Indicate that loading is complete
  callback(total, total);

  return {
    files: slpGames,
    fileErrorCount,
  };
}
