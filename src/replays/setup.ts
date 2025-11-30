import { app } from "electron";
import log from "electron-log";
import path from "path";

import { FileSystemReplayProvider } from "./file_system_replay_provider/file_system_replay_provider";
import { FolderTreeService } from "./folder_tree_service";
import {
  ipc_calculateGameStats,
  ipc_calculateStadiumStats,
  ipc_getAllFilePaths,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_searchGames,
  ipc_selectTreeFolder,
} from "./ipc";
import type { Progress, ReplayProvider } from "./types";

const REPLAY_DATABASE_NAME = "slippi.sqlite";

const isDevelopment = process.env.NODE_ENV === "development";

async function createReplayProvider({
  enableReplayDatabase,
}: {
  enableReplayDatabase?: boolean;
}): Promise<ReplayProvider> {
  if (enableReplayDatabase) {
    try {
      const replayDatabaseFolder = path.join(app.getPath("userData"), REPLAY_DATABASE_NAME);
      const [{ createDatabase }, { DatabaseReplayProvider }] = await Promise.all([
        import("@database/create_database"),
        import("./database_replay_provider/database_replay_provider"),
      ]);
      const database = await createDatabase(isDevelopment ? undefined : replayDatabaseFolder);
      return new DatabaseReplayProvider(database);
    } catch (err) {
      log.warn("Failed to init database replay provider: ", err);
    }
  }

  return new FileSystemReplayProvider();
}

export default function setupReplaysIpc({ enableReplayDatabase }: { enableReplayDatabase?: boolean }) {
  const treeService = new FolderTreeService();
  const replayProviderPromise = createReplayProvider({ enableReplayDatabase });

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

    const replayProvider = await replayProviderPromise;
    return await replayProvider.loadFolder(folderPath, onProgress);
  });

  ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
    const replayProvider = await replayProviderPromise;
    const [stats, fileResult] = await Promise.all([
      replayProvider.calculateGameStats(filePath),
      replayProvider.loadFile(filePath),
    ]);
    return { file: fileResult, stats };
  });

  ipc_calculateStadiumStats.main!.handle(async ({ filePath }) => {
    const replayProvider = await replayProviderPromise;
    const [stadiumStats, fileResult] = await Promise.all([
      replayProvider.calculateStadiumStats(filePath),
      replayProvider.loadFile(filePath),
    ]);
    return { file: fileResult, stadiumStats };
  });

  ipc_searchGames.main!.handle(async ({ folderPath, options = {} }) => {
    const replayProvider = await replayProviderPromise;

    // Check if the provider supports searchReplays (DatabaseReplayProvider)
    if ("searchReplays" in replayProvider && typeof replayProvider.searchReplays === "function") {
      const { limit = 20, continuation, orderBy = { field: "startTime", direction: "desc" } } = options;

      // Progress callback for database sync
      const onProgress = (progress: Progress) => {
        ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
      };

      // Convert hideShortGames filter to database filter
      const filters: any[] = [];
      if (options.hideShortGames) {
        filters.push({
          type: "duration" as const,
          minFrames: 30 * 60, // 30 seconds
        });
      }

      return await replayProvider.searchReplays(folderPath, limit, continuation, orderBy, filters, onProgress);
    }

    // Fallback to loadFolder for FileSystemReplayProvider
    const onProgress = (progress: Progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    };
    const result = await replayProvider.loadFolder(folderPath, onProgress);
    return { files: result.files, continuation: undefined };
  });

  ipc_getAllFilePaths.main!.handle(async ({ folderPath, options = {} }) => {
    const replayProvider = await replayProviderPromise;

    // Check if the provider supports getAllFilePaths (DatabaseReplayProvider)
    if ("getAllFilePaths" in replayProvider && typeof replayProvider.getAllFilePaths === "function") {
      const { orderBy = { field: "startTime", direction: "desc" } } = options;

      // Convert hideShortGames filter to database filter
      const filters: any[] = [];
      if (options.hideShortGames) {
        filters.push({
          type: "duration" as const,
          minFrames: 30 * 60, // 30 seconds
        });
      }

      return await replayProvider.getAllFilePaths(folderPath, orderBy, filters);
    }

    // Fallback to loadFolder for FileSystemReplayProvider
    const onProgress = (progress: Progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    };
    const result = await replayProvider.loadFolder(folderPath, onProgress);
    return result.files.map((f) => f.fullPath);
  });
}
