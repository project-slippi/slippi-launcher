import { app } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import path from "path";

import { createDatabaseWorker } from "./db.worker.interface";
import { FolderTreeService } from "./folderTreeService";
import {
  ipc_calculateGameStats,
  ipc_computeStatsCache,
  ipc_getStatsStatus,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
  ipc_statsProgressUpdatedEvent,
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
    const { totalCount, toLoad, toDelete, totalBytes } = await filterReplays(folderPath, loadedFiles);
    log.info(
      `Found ${totalCount} files in ${folderPath}, ${toLoad.length} are new. ${toDelete.length} will be removed from the DB`,
    );
    if (toDelete.length > 0) {
      await dbWorker.deleteReplays(toDelete);
      log.info(`Deleted ${toDelete.length} replays from the db`);
    }

    const sub = worker.getProgressObservable().subscribe((progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(log.warn);
    });

    // Save the new replays into the database
    const parsed = await worker.loadReplays(toLoad);
    await dbWorker.saveReplays(parsed.files);

    const files = await dbWorker.getFolderReplays(folderPath);
    log.info(`Loaded ${files.length} replays in ${folderPath} from the db`);

    sub.unsubscribe();

    return {
      files,
      totalBytes,
      fileErrorCount: totalCount - files.length,
    };
  });

  ipc_computeStatsCache.main!.handle(async () => {
    console.log("Computing stats cache");
    const [worker, dbWorker] = await Promise.all([replayBrowserWorker, databaseBrowserWorker]);
    const sub = worker.getGlobalStatsObservable().subscribe((progress) => {
      ipc_statsProgressUpdatedEvent.main!.trigger(progress).catch(log.warn);
    });
    const { count, toCompute } = await dbWorker.getAllFiles();
    console.log("got files", toCompute);
    const progress = count - toCompute.length;
    for (let i = 0; i < toCompute.length; i += 20) {
      const files = toCompute.slice(i, i + 20);
      console.log("caching batch", files);
      const filesWithStats = await worker.computeAllStats(files, progress + i, count);
      await dbWorker.storeStatsCache(filesWithStats);
    }
    sub.unsubscribe();
    dbWorker.setStatsStatus(true);
    return { sub };
  });

  ipc_getStatsStatus.main!.handle(async () => {
    const dbWorker = await databaseBrowserWorker;
    const status = await dbWorker.getStatsStatus();
    return { loaded: status };
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const [worker, dbWorker] = await Promise.all([replayBrowserWorker, databaseBrowserWorker]);
    const dbResult = await dbWorker.getFullReplay(filePath);
    if (dbResult && dbResult.stats) {
      return { file: dbResult, stats: dbResult?.stats };
    }
    const result = await worker.calculateGameStats(filePath);
    const fileResult = await worker.loadSingleFile(filePath);
    return { file: fileResult, stats: result };
  });
}

async function filterReplays(folder: string, loadedFiles: string[]) {
  // Find which files still actually exist
  const dirfiles = await fs.readdir(folder, { withFileTypes: true });
  const slpFiles = dirfiles
    .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
    .map((d) => path.resolve(folder, d.name));

  const stats = slpFiles.map((filename) => fs.stat(filename));
  const totalBytes = (await Promise.allSettled(stats))
    .map((res) => (res.status === "fulfilled" ? res.value.size : 0))
    .reduce((acc, size) => acc + size, 0);

  // These are the new files that we haven't indexed
  const toLoad = slpFiles.filter((file) => !loadedFiles.includes(file));

  // These are the files no longer exist so we should delete them
  const toDelete = loadedFiles.filter((file) => !slpFiles.includes(file));

  return { totalCount: slpFiles.length, toLoad, toDelete, totalBytes };
}
