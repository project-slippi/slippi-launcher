export interface FileResult {
  name: string;
  fullPath: string;
  hasError: boolean;
  startTime: string | null;
  lastFrame: number | null;
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
}
