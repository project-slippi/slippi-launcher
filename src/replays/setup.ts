import { FileSystemReplayProvider } from "./file_system_replay_provider/file_system_replay_provider";
import { FolderTreeService } from "./folderTreeService";
import {
  ipc_calculateGameStats,
  ipc_calculateStadiumStats,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
} from "./ipc";
import type { Progress, ReplayProvider } from "./types";

export default function setupReplaysIpc() {
  const treeService = new FolderTreeService();
  const replayProvider: ReplayProvider = new FileSystemReplayProvider();
  replayProvider.init();

  ipc_initializeFolderTree.main!.handle(async ({ folders }) => {
    return treeService.init(folders);
  });

  ipc_selectTreeFolder.main!.handle(async ({ folderPath }) => {
    return await treeService.select(folderPath);
  });

  ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
    const onProgress = (progress: Progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    };

    return replayProvider.loadFolder(folderPath, onProgress);
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const result = await replayProvider.calculateGameStats(filePath);
    const fileResult = await replayProvider.loadFile(filePath);
    return { file: fileResult, stats: result };
  });

  ipc_calculateStadiumStats.main!.handle(async ({ filePath }) => {
    const result = await replayProvider.calculateStadiumStats(filePath);
    const fileResult = await replayProvider.loadFile(filePath);
    return { file: fileResult, stadiumStats: result };
  });
}
