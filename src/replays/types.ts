import { GameStartType, MetadataType } from "@slippi/slippi-js";

// Note that only basic types can be sent over IPC (JSON basically).

export interface FileResult {
  header: FileHeader;
  details: FileDetails | null;
}

export interface FileHeader {
  name: string;
  fullPath: string;
  birthtimeMs: number;
}

export interface FileDetails {
  settings: GameStartType;
  startTime: string | null;
  lastFrame: number | null;
  metadata: MetadataType | null;
}

export interface FolderResult {
  name: string;
  fullPath: string;
  subdirectories: FolderResult[];
  collapsed: boolean;
}

export interface FolderLoadResult {
  files: FileHeader[];
  fileErrorCount: number;
}

export interface Progress {
  current: number;
  total: number;
}

export interface FileLoadComplete {
  path: string;
  details: FileDetails;
  // Identifies which batcher is associated with this event. If a new batcher
  // has been started, event will be ignored.
  batcherId: number;
}

export interface FileLoadError {
  path: string;
  error: Error;
  // Identifies which batcher is associated with this event. If a new batcher
  // has been started, event will be ignored.
  batcherId: number;
}
