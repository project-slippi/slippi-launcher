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
