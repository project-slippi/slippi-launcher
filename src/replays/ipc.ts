import type { StatsType } from "@slippi/slippi-js";
import { _, makeEndpoint } from "utils/ipc";

import type {
  FileHeader,
  FileLoadComplete,
  FileLoadError,
  FileResult,
  FolderLoadResult,
  FolderResult,
  Progress,
} from "./types";

// Handlers

export const ipc_loadReplayFolder = makeEndpoint.main(
  "loadReplayFolder",
  <{ folderPath: string }>_,
  <FolderLoadResult>_,
);

export const ipc_loadReplayFiles = makeEndpoint.main(
  "loadReplayFiles",
  <{ fileHeaders: FileHeader[]; batcherId: number }>_,
  <Record<string, never>>_,
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

// Events

export const ipc_loadProgressUpdatedEvent = makeEndpoint.renderer("replays_loadProgressUpdated", <Progress>_);
export const ipc_fileLoadCompleteEvent = makeEndpoint.renderer("replays_fileLoadComplete", <FileLoadComplete>_);
export const ipc_fileLoadErrorEvent = makeEndpoint.renderer("replays_fileLoadError", <FileLoadError>_);
export const ipc_statsPageRequestedEvent = makeEndpoint.renderer("replays_showStatsPage", <{ filePath: string }>_);
