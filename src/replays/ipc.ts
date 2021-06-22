import { StatsType } from "@slippi/slippi-js";

import { _, makeEndpoint } from "../ipc";
import { FileLoadResult, FileResult, Progress } from "./types";

// Handlers

export const loadReplayFolder = makeEndpoint.main("loadReplayFolder", <{ folderPath: string }>_, <FileLoadResult>_);

export const calculateGameStats = makeEndpoint.main(
  "calculateGameStats",
  <{ filePath: string }>_,
  <{ file: FileResult; stats: StatsType | null }>_,
);

// Events

export const loadProgressUpdated = makeEndpoint.renderer("replays_loadProgressUpdated", <Progress>_);

export const playReplayAndShowStatsPage = makeEndpoint.renderer(
  "replays_playReplayAndShowStatsPage",
  <{ filePath: string }>_,
);
