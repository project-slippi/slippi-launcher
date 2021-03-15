import { FileLoadResult } from "common/types";
import * as fs from "fs-extra";
import path from "path";

import { worker } from "./dbWorkerInterface";
import { loadReplays } from "./workerInterface";

const filterReplays = async (folder: string, loadedFiles: string[]) => {
  const dirfiles = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = dirfiles
    .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
    .map((d) => path.resolve(folder, d.name));

  const toLoad = slpFiles.filter((file) => !loadedFiles.includes(file));
  const toDelete = loadedFiles.filter((file) => !slpFiles.includes(file));

  return { total: slpFiles.length, toLoad, toDelete };
};

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

  const w = await worker;
  const loadedFiles = await w.getFolderFiles(folder);
  const { total, toLoad, toDelete } = await filterReplays(folder, loadedFiles);
  console.log(`found ${total} files in ${folder}, ${total} are new. ${toDelete.length} will be removed from the DB`);

  if (toDelete.length > 0) {
    await w.deleteReplays(toDelete);
    console.log(`deleted ${toDelete.length} replays from the db`);
  }
  let fileErrorCount = 0;
  if (toLoad.length > 0) {
    const parsed = await loadReplays(toLoad, (count) => callback(count, toLoad.length));
    fileErrorCount = toLoad.length - parsed.length;
    await w.saveReplays(parsed);
  }

  const files = await w.getFolderReplays(folder);
  console.log(`loaded ${files.length} replays in ${folder} from the db`);

  return { files, fileErrorCount };
}
