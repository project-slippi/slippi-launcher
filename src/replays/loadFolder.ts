import { exists } from "@common/exists";
import * as fs from "fs-extra";
import path from "path";

import { worker } from "./db.worker.interface";
import { loadFile } from "./loadFile";
import type { FileLoadResult, FileResult } from "./types";

const filterReplays = async (folder: string, loadedFiles: string[]) => {
  const dirfiles = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = dirfiles
    .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
    .map((d) => path.resolve(folder, d.name));

  const toLoad = slpFiles.filter((file) => !loadedFiles.includes(file));
  const toDelete = loadedFiles.filter((file) => !slpFiles.includes(file));

  return { total: slpFiles.length, toLoad, toDelete };
};

const loadReplays = async (
  files: string[],
  progressCallback: (count: number) => Promise<void>,
): Promise<{ files: FileResult[]; totalBytes: number }> => {
  let count = 0;
  const fileSizesPromise = Promise.all(
    files.map(async (fullPath): Promise<number> => {
      const stat = await fs.stat(fullPath);
      return stat.size;
    }),
  );

  const slpGamesPromise = Promise.all(
    files.map(async (file) => {
      const res = await loadFile(file);
      await progressCallback(count++);
      return res;
    }),
  );

  const [slpGames, fileSizes] = await Promise.all([slpGamesPromise, fileSizesPromise]);

  return {
    files: slpGames.filter(exists),
    totalBytes: fileSizes.reduce((acc, size) => acc + size, 0),
  };
};

export async function loadFolder(
  folder: string,
  callback?: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  // If the folder does not exist, return empty
  if (!(await fs.pathExists(folder))) {
    return {
      files: [],
      fileErrorCount: 0,
      totalBytes: 0,
    };
  }

  const w = await worker;
  const loadedFiles = await w.getFolderFiles(folder);
  const { total, toLoad, toDelete } = await filterReplays(folder, loadedFiles);
  console.log(
    `found ${total} files in ${folder}, ${toLoad.length} are new. ${toDelete.length} will be removed from the DB`,
  );

  if (toDelete.length > 0) {
    await w.deleteReplays(toDelete);
    console.log(`deleted ${toDelete.length} replays from the db`);
  }
  let fileErrorCount = 0;
  let totalBytes = 0;
  if (toLoad.length > 0) {
    const parsed = await loadReplays(toLoad, async (count) => {
      callback && callback(count, toLoad.length);
    });
    fileErrorCount = toLoad.length - parsed.files.length;
    totalBytes = parsed.totalBytes;
    await w.saveReplays(parsed.files);
  }

  const files = await w.getFolderReplays(folder);
  console.log(`loaded ${files.length} replays in ${folder} from the db`);

  return { files, fileErrorCount, totalBytes };
}
