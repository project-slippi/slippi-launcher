import { exists } from "@common/exists";
import getKyselyDatabase from "database/dataSource";
import insertReplays from "database/insertReplays";
import { loadReplays } from "database/loadReplays";
import * as fs from "fs-extra";
import path from "path";

import { loadFile } from "./loadFile";
import type { FileLoadResult, FileResult } from "./types";

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

  // Get already processed files from database
  const database = await getKyselyDatabase(path.resolve(folder, ".index.sqlite3"));
  const replaysIndexed = await loadReplays(database, fullSlpPaths);
  const totalBytesIndexed = replaysIndexed.reduce((acc, replay) => acc + replay.size, 0);

  // Calculate files that still need to be processed
  const fullSlpPathsIndexed = replaysIndexed.map((replay) => replay.fullPath);
  const fullSlpPathsNew = fullSlpPaths.filter((dirent) => !fullSlpPathsIndexed.includes(dirent));

  // Ensure we actually have files to process
  const total = fullSlpPaths.length;
  if (total === 0) {
    return {
      files: replaysIndexed,
      fileErrorCount: 0,
      totalBytes: totalBytesIndexed,
    };
  }

  let fileValidCount = 0;
  callback(0, total);

  const process = async (path: string) => {
    return new Promise<FileResult | null>((resolve) => {
      setImmediate(async () => {
        try {
          const res = await loadFile(path);
          res.size = (await fs.stat(path)).size;
          fileValidCount += 1;
          callback(fileValidCount, total);
          resolve(res);
        } catch (err) {
          resolve(null);
        }
      });
    });
  };

  const slpGames = await Promise.all(
    fullSlpPathsNew.map((fullPath) => {
      return process(fullPath);
    }),
  );
  const replaysNew = slpGames.filter(exists);

  const totalBytesNew = replaysNew.reduce((acc, replay) => acc + replay.size, 0);

  // Insert newly processed files
  await insertReplays(database, replaysNew);

  // Indicate that loading is complete
  callback(total, total);

  return {
    files: replaysIndexed.concat(replaysNew),
    fileErrorCount: total - fileValidCount,
    totalBytes: totalBytesIndexed + totalBytesNew,
  };
}
