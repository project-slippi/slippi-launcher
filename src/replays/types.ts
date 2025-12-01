import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";

export type PlayerInfo = {
  playerIndex: number;
  port: number;
  type: number | null;
  characterId: number | null;
  characterColor: number | null;
  teamId: number | null;
  isWinner: boolean;
  connectCode: string | null;
  displayName: string | null;
  tag: string | null;
  startStocks: number | null;
};

export type FileResult = {
  id: string; // Database-generated file._id
  fileName: string;
  fullPath: string;
  game: GameInfo;
};

export type GameInfo = {
  players: PlayerInfo[];
  isTeams: boolean;
  stageId: number | null;
  startTime: string | null;
  platform: string | null;
  consoleNickname: string | null;
  mode: number | null;
  lastFrame: number | null;
  timerType: number | null;
  startingTimerSeconds: number | null;
};

export type FolderResult = {
  name: string;
  fullPath: string;
  subdirectories: FolderResult[];
};

export type Progress = {
  current: number;
  total: number;
};

export interface ReplayProvider {
  loadFile(filePath: string): Promise<FileResult>;
  calculateGameStats(fullPath: string): Promise<StatsType | null>;
  calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null>;
  deleteReplays(fileIds: string[]): Promise<void>;
  searchReplays(
    folder: string,
    limit?: number,
    continuation?: string,
    orderBy?: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    },
    filters?: any[],
    onProgress?: (progress: Progress) => void,
  ): Promise<{
    files: FileResult[];
    continuation: string | undefined;
    totalCount?: number;
  }>;
  getAllFilePaths(
    folder: string,
    orderBy?: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    },
    filters?: any[],
  ): Promise<string[]>;
  bulkDeleteReplays(
    folder: string,
    filters?: any[],
    options?: {
      excludeFilePaths?: string[];
    },
  ): Promise<{ deletedCount: number }>;
}

export type SearchGamesOptions = {
  limit?: number;
  continuation?: string;
  orderBy?: {
    field: "startTime" | "lastFrame";
    direction?: "asc" | "desc";
  };
  hideShortGames?: boolean;
  searchText?: string;
};

export type SearchGamesResult = {
  files: FileResult[];
  continuation: string | undefined;
  totalCount?: number;
};

export type BulkDeleteOptions = {
  hideShortGames?: boolean;
  searchText?: string;
  excludeFilePaths?: string[];
};

export type BulkDeleteResult = {
  deletedCount: number;
};

export interface ReplayService {
  initializeFolderTree(folders: readonly string[]): Promise<readonly FolderResult[]>;
  selectTreeFolder(folderPath: string): Promise<readonly FolderResult[]>;
  searchGames(folderPath: string, options?: SearchGamesOptions): Promise<SearchGamesResult>;
  getAllFilePaths(folderPath: string, options?: SearchGamesOptions): Promise<string[]>;
  calculateGameStats(filePath: string): Promise<{ file: FileResult; stats: StatsType | null }>;
  calculateStadiumStats(filePath: string): Promise<{ file: FileResult; stadiumStats: StadiumStatsType | null }>;
  deleteReplays(fileIds: string[]): Promise<void>;
  bulkDeleteReplays(folderPath: string, options?: BulkDeleteOptions): Promise<BulkDeleteResult>;
  onReplayLoadProgressUpdate(handle: (progress: Progress) => void): () => void;
  onStatsPageRequest(handle: (filePath: string) => void): () => void;
}
