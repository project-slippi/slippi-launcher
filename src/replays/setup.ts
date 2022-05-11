import { FolderTreeService } from "./folderTreeService";
import {
  ipc_calculateGameStats,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFiles,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
} from "./ipc";
import { createReplayWorker } from "./replays.worker.interface";

export default function setupReplaysIpc() {
  const treeService = new FolderTreeService();
  const replayBrowserWorker = createReplayWorker();

  ipc_initializeFolderTree.main!.handle(async ({ folders }) => {
    return treeService.init(folders);
  });

  ipc_selectTreeFolder.main!.handle(async ({ folderPath }) => {
    return await treeService.select(folderPath);
  });

  ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
    const worker = await replayBrowserWorker;
    worker.getProgressObservable().subscribe((progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    });
    return await worker.loadReplayFolder(folderPath);
  });

  ipc_loadReplayFiles.main!.handle(async ({ fileHeaders, batcherId }) => {
    const worker = await replayBrowserWorker;
    await worker.loadReplayFiles(fileHeaders, batcherId);
    return {};
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const worker = await replayBrowserWorker;
    const [statsResult, fileResult] = await Promise.all([worker.calculateGameStats(filePath), worker.loadSingleFile(filePath)]);
    return { file: fileResult, stats: statsResult };
  });
}
