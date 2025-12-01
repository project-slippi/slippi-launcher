import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { _, makeEndpoint } from "utils/ipc";

import type {
  BulkDeleteOptions,
  BulkDeleteResult,
  FileLoadResult,
  FileResult,
  FolderResult,
  Progress,
  SearchGamesOptions,
  SearchGamesResult,
} from "./types";

// Handlers

export const ipc_loadReplayFolder = makeEndpoint.main("loadReplayFolder", <{ folderPath: string }>_, <FileLoadResult>_);

export const ipc_searchGames = makeEndpoint.main(
  "searchGames",
  <{ folderPath: string; options?: SearchGamesOptions }>_,
  <SearchGamesResult>_,
);

export const ipc_getAllFilePaths = makeEndpoint.main(
  "getAllFilePaths",
  <{ folderPath: string; options?: SearchGamesOptions }>_,
  <string[]>_,
);

export const ipc_initializeFolderTree = makeEndpoint.main(
  "initializeFolderTree",
  <{ folders: readonly string[] }>_,
  <readonly FolderResult[]>_,
);

export const ipc_selectTreeFolder = makeEndpoint.main(
  "selectTreeFolder",
  <{ folderPath: string }>_,
  <readonly FolderResult[]>_,
);

export const ipc_calculateGameStats = makeEndpoint.main(
  "calculateGameStats",
  <{ filePath: string }>_,
  <{ file: FileResult; stats: StatsType | null }>_,
);

export const ipc_calculateStadiumStats = makeEndpoint.main(
  "calculateStadiumStats",
  <{ filePath: string }>_,
  <{ file: FileResult; stadiumStats: StadiumStatsType | null }>_,
);

export const ipc_deleteReplays = makeEndpoint.main("deleteReplays", <{ fileIds: string[] }>_, <{ success: boolean }>_);

export const ipc_bulkDeleteReplays = makeEndpoint.main(
  "bulkDeleteReplays",
  <{ folderPath: string; options?: BulkDeleteOptions }>_,
  <BulkDeleteResult>_,
);

// Events

export const ipc_loadProgressUpdatedEvent = makeEndpoint.renderer("replays_loadProgressUpdated", <Progress>_);

export const ipc_statsPageRequestedEvent = makeEndpoint.renderer("replays_showStatsPage", <{ filePath: string }>_);
