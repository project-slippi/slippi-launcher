import { createDatabase } from "@database/create_database";
import { app } from "electron";
import log from "electron-log";
import path from "path";

import { DatabaseReplayProvider } from "./database_replay_provider/database_replay_provider";
import { FolderTreeService } from "./folder_tree_service";
import {
  ipc_bulkDeleteReplays,
  ipc_calculateGameStats,
  ipc_calculateStadiumStats,
  ipc_deleteReplays,
  ipc_getAllFilePaths,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_searchGames,
  ipc_selectTreeFolder,
} from "./ipc";
import type { Progress } from "./types";

const REPLAY_DATABASE_NAME = "slippi.sqlite";

const isDevelopment = process.env.NODE_ENV === "development";

async function createReplayProvider() {
  const replayDatabaseFolder = path.join(app.getPath("userData"), REPLAY_DATABASE_NAME);
  try {
    const database = await createDatabase(isDevelopment ? undefined : replayDatabaseFolder);
    return new DatabaseReplayProvider(database);
  } catch (err) {
    log.error(
      `Fatal error: Failed to initialize replay database at ${replayDatabaseFolder}: ${err}. Using in-memory database instead.`,
    );
    const database = await createDatabase(undefined);
    return new DatabaseReplayProvider(database);
  }
}

export default function setupReplaysIpc() {
  const treeService = new FolderTreeService();
  const replayProviderPromise = createReplayProvider();

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
    const { limit = 20, continuation, orderBy = { field: "startTime", direction: "desc" } } = options;

    // Progress callback for database sync
    const onProgress = (progress: Progress) => {
      ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
    };

    // Convert options to database filters
    const filters: any[] = [];
    if (options.hideShortGames) {
      filters.push({
        type: "duration" as const,
        minFrames: 30 * 60, // 30 seconds
      });
    }
    if (options.searchText && options.searchText.trim() !== "") {
      filters.push({
        type: "textSearch" as const,
        query: options.searchText.trim(),
      });
    }

    return await replayProvider.searchReplays(folderPath, limit, continuation, orderBy, filters, onProgress);
  });

  ipc_getAllFilePaths.main!.handle(async ({ folderPath, options = {} }) => {
    const replayProvider = await replayProviderPromise;
    const { orderBy = { field: "startTime", direction: "desc" } } = options;

    // Convert options to database filters
    const filters: any[] = [];
    if (options.hideShortGames) {
      filters.push({
        type: "duration" as const,
        minFrames: 30 * 60, // 30 seconds
      });
    }
    if (options.searchText && options.searchText.trim() !== "") {
      filters.push({
        type: "textSearch" as const,
        query: options.searchText.trim(),
      });
    }

    return await replayProvider.getAllFilePaths(folderPath, orderBy, filters);
  });

  ipc_deleteReplays.main!.handle(async ({ fileIds }) => {
    const replayProvider = await replayProviderPromise;
    await replayProvider.deleteReplays(fileIds);
    return { success: true };
  });

  ipc_bulkDeleteReplays.main!.handle(async ({ folderPath, options = {} }) => {
    const replayProvider = await replayProviderPromise;

    // Convert options to database filters
    const filters: any[] = [];
    if (options.hideShortGames) {
      filters.push({
        type: "duration" as const,
        minFrames: 30 * 60, // 30 seconds
      });
    }
    if (options.searchText && options.searchText.trim() !== "") {
      filters.push({
        type: "textSearch" as const,
        query: options.searchText.trim(),
      });
    }

    return await replayProvider.bulkDeleteReplays(folderPath, filters, {
      excludeFilePaths: options.excludeFilePaths,
    });
  });
}
