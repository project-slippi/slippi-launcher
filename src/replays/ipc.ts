import { StatsType } from "@slippi/slippi-js";

import { _, makeEndpoint } from "../ipc";
import { FileLoadResult, Progress } from "./types";

// Handlers

export const loadReplayFolder = makeEndpoint.main("loadReplayFolder", <{ folderPath: string }>_, <FileLoadResult>_);

export const calculateGameStats = makeEndpoint.main(
  "calculateGameStats",
  <{ filePath: string }>_,
  <{ stats: StatsType | null }>_,
);

// Events

export const loadProgressUpdated = makeEndpoint.renderer("replays_loadProgressUpdated", <Progress>_);
