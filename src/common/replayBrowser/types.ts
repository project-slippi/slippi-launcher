import { MetadataType, GameStartType } from "@slippi/slippi-js";

export interface FileResult {
  name: string;
  fullPath: string;
  settings: GameStartType;
  startTime: string | null;
  lastFrame: number | null;
  metadata: MetadataType | null;
  // stats: StatsType | null; // TODO calculating full stats is too slow to do on everything on load... remove this
  // latestFrame: any | null; //This is also slow...
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
