import { MetadataType, GameStartType } from "@slippi/slippi-js";

export interface FileResult {
  name: string;
  fullPath: string;
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

export interface FileLoadResult {
  files: FileResult[];
  aborted: boolean;
  fileErrorCount: number;
}
