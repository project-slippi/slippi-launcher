import { createDatabase } from "database/create_database";
import { app } from "electron";
import log from "electron-log";
import path from "path";

import { DatabaseReplayProvider } from "./database_replay_provider/database_replay_provider";
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

const REPLAY_DATABASE_NAME = "slippi.sqlite";

const isDevelopment = process.env.NODE_ENV === "development";

function initDatabaseReplayProvider(): ReplayProvider {
  const replayDatabaseFolder = path.join(app.getPath("userData"), REPLAY_DATABASE_NAME);
  return new DatabaseReplayProvider(() => createDatabase(isDevelopment ? undefined : replayDatabaseFolder));
}

export default function setupReplaysIpc({ enableReplayDatabase }: { enableReplayDatabase?: boolean }) {
  const treeService = new FolderTreeService();
  const replayProvider: ReplayProvider = enableReplayDatabase
    ? initDatabaseReplayProvider()
    : new FileSystemReplayProvider();
  replayProvider.init().catch(log.error);

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

    return await replayProvider.loadFolder(folderPath, onProgress);
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const [stats, fileResult] = await Promise.all([
      replayProvider.calculateGameStats(filePath),
      replayProvider.loadFile(filePath),
    ]);
    return { file: fileResult, stats };
  });

  ipc_calculateStadiumStats.main!.handle(async ({ filePath }) => {
    const [stadiumStats, fileResult] = await Promise.all([
      replayProvider.calculateStadiumStats(filePath),
      replayProvider.loadFile(filePath),
    ]);
    return { file: fileResult, stadiumStats };
  });
}
