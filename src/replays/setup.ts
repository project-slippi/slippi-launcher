import { app } from "electron";
import * as fs from "fs-extra";
import path from "path";

import { createDatabaseWorker } from "./db.worker.interface";
import { FolderTreeService } from "./folderTreeService";
import {
  ipc_calculateGameStats,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
} from "./ipc";
import { createReplayWorker } from "./replays.worker.interface";

const isDevelopment = process.env.NODE_ENV === "development";

export default function setupReplaysIpc() {
  const databaseFile = isDevelopment ? "test.db" : "slippi.db";
  const databasePath = path.join(app.getPath("userData"), databaseFile);

  const treeService = new FolderTreeService();
  const replayBrowserWorker = createReplayWorker();
  const databaseBrowserWorker = createDatabaseWorker(databasePath);

  ipc_initializeFolderTree.main!.handle(async ({ folders }) => {
    return treeService.init(folders);
  });

  ipc_selectTreeFolder.main!.handle(async ({ folderPath }) => {
    return await treeService.select(folderPath);
  });

  ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
    // If the folder does not exist, return empty
    if (!(await fs.pathExists(folderPath))) {
      return {
        files: [],
        fileErrorCount: 0,
        totalBytes: 0,
      };
    }
    const [worker, dbWorker] = await Promise.all([replayBrowserWorker, databaseBrowserWorker]);
    const loadedFiles = await dbWorker.getFolderFiles(folderPath);
    const { total, toLoad, toDelete } = await filterReplays(folderPath, loadedFiles);
    console.log(
      `found ${total} files in ${folderPath}, ${toLoad.length} are new. ${toDelete.length} will be removed from the DB`,
    );
    if (toDelete.length > 0) {
      await dbWorker.deleteReplays(toDelete);
      console.log(`deleted ${toDelete.length} replays from the db`);
    }

    worker.getProgressObservable().subscribe((progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    });

    // Save the new replays into the database
    const parsed = await worker.loadReplays(toLoad);
    await dbWorker.saveReplays(parsed.files);

    const files = await dbWorker.getFolderReplays(folderPath);
    console.log(`loaded ${files.length} replays in ${folderPath} from the db`);

    return {
      files,
      // FIXME: These values are incorrect.
      fileErrorCount: parsed.fileErrorCount,
      totalBytes: parsed.totalBytes,
    };
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const worker = await replayBrowserWorker;
    const result = await worker.calculateGameStats(filePath);
    const fileResult = await worker.loadSingleFile(filePath);
    return { file: fileResult, stats: result };
  });
}

const filterReplays = async (folder: string, loadedFiles: string[]) => {
  // Find which files still actually exist
  const dirfiles = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = dirfiles
    .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
    .map((d) => path.resolve(folder, d.name));

  // These are the new files that we haven't indexed
  const toLoad = slpFiles.filter((file) => !loadedFiles.includes(file));

  // These are the files no longer exist so we should delete them
  const toDelete = loadedFiles.filter((file) => !slpFiles.includes(file));

  return { total: slpFiles.length, toLoad, toDelete };
};
