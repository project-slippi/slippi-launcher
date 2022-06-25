import * as fs from "fs-extra";

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

export default function setupReplaysIpc() {
  const treeService = new FolderTreeService();
  const replayBrowserWorker = createReplayWorker();
  const databaseBrowserWorker = createDatabaseWorker();

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
    const worker = await replayBrowserWorker;
    const dbWorker = await databaseBrowserWorker;
    const loadedFiles = dbWorker.getFolderFiles(folderPath);

    worker.getProgressObservable().subscribe((progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    });
    const result = await worker.loadReplayFolder(folderPath);
    return result;
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const worker = await replayBrowserWorker;
    const result = await worker.calculateGameStats(filePath);
    const fileResult = await worker.loadSingleFile(filePath);
    return { file: fileResult, stats: result };
  });
}
