import { FolderTreeService } from "./folderTreeService";
import {
  ipc_calculateGameStats,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
} from "./ipc";
import { worker as replayBrowserWorker } from "./replays.worker.interface";

export default function installReplaysIpc() {
  const treeService = new FolderTreeService();

  ipc_initializeFolderTree.main!.handle(async ({ folders }) => {
    return treeService.init(folders);
  });

  ipc_selectTreeFolder.main!.handle(async ({ folderPath }) => {
    return await treeService.select(folderPath);
  });

  ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
    const w = await replayBrowserWorker;
    w.getProgressObservable().subscribe((progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    });
    const result = await w.loadReplayFolder(folderPath);
    return result;
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const w = await replayBrowserWorker;
    const result = await w.calculateGameStats(filePath);
    const fileResult = await w.loadSingleFile(filePath);
    return { file: fileResult, stats: result };
  });
}
