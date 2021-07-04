import { StatsType } from "@slippi/slippi-js";

import { _, makeEndpoint } from "../ipc";
import { FileLoadResult, FileResult, Progress } from "./types";

// Handlers

export const ipc_loadReplayFolder = makeEndpoint.main("loadReplayFolder", <{ folderPath: string }>_, <FileLoadResult>_);

export const ipc_calculateGameStats = makeEndpoint.main(
  "calculateGameStats",
  <{ filePath: string }>_,
  <{ file: FileResult; stats: StatsType | null }>_,
);

// Events

export const ipc_loadProgressUpdatedEvent = makeEndpoint.renderer("replays_loadProgressUpdated", <Progress>_);

export const ipc_statsPageRequestedEvent = makeEndpoint.renderer("replays_showStatsPage", <{ filePath: string }>_);
