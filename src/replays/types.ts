import type { GameStartType, MetadataType } from "@slippi/slippi-js";

export type FileResult = {
  name: string;
  fullPath: string;
  size: number;
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
