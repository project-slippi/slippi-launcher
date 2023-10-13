import type { GameStartType, MetadataType, StadiumStatsType, StatsType } from "@slippi/slippi-js";

export type FileResult = {
  name: string;
  fullPath: string;
  settings: GameStartType;
  startTime: string | null;
  lastFrame: number | null;
  metadata: MetadataType | null;
  winnerIndices: number[];
};

export type FolderResult = {
  name: string;
  fullPath: string;
  subdirectories: FolderResult[];
};

export type FileLoadResult = {
  files: FileResult[];
  totalBytes: number;
  fileErrorCount: number;
};

export type Progress = {
  current: number;
  total: number;
};

export interface ReplayProvider {
  init(): void;
  loadFile(filePath: string): Promise<FileResult>;
  loadFolder(folder: string, onProgress?: (progress: Progress) => void): Promise<FileLoadResult>;
  calculateGameStats(fullPath: string): Promise<StatsType | null>;
  calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null>;
}
