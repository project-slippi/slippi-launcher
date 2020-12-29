import { MetadataType, GameStartType } from "@slippi/slippi-js";

export interface FileResult {
  name: string;
  fullPath: string;
  settings: GameStartType; // TODO why not rename this SettingsType or gameStart
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
  fileErrorCount: number;
}
