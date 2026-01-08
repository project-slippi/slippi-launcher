import type { ReplayFilter } from "@database/filters/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";

export type PlayerInfo = {
  playerIndex: number;
  port: number;
  type: number | undefined;
  characterId: number | undefined;
  characterColor: number | undefined;
  teamId: number | undefined;
  isWinner: boolean;
  connectCode: string | undefined;
  displayName: string | undefined;
  tag: string | undefined;
  startStocks: number | undefined;
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
  stageId: number | undefined;
  startTime: string | undefined;
  platform: string | undefined;
  consoleNickname: string | undefined;
  mode: number | undefined;
  lastFrame: number | undefined;
  timerType: number | undefined;
  startingTimerSeconds: number | undefined;
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
  calculateGameStats(fullPath: string): Promise<StatsType | undefined>;
  calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | undefined>;
  deleteReplays(fileIds: string[]): Promise<void>;
  searchReplays(
    folder: string | undefined,
    limit?: number,
    continuation?: string,
    orderBy?: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    },
    filters?: ReplayFilter[],
    onProgress?: (progress: Progress) => void,
  ): Promise<{
    files: FileResult[];
    continuation: string | undefined;
    totalCount?: number;
  }>;
  getAllFilePaths(
    folder: string | undefined,
    orderBy?: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    },
    filters?: ReplayFilter[],
  ): Promise<string[]>;
  bulkDeleteReplays(
    folder: string | undefined,
    filters?: ReplayFilter[],
    options?: {
      excludeFilePaths?: string[];
    },
  ): Promise<{ deletedCount: number }>;
}

export type SearchGamesOptions = {
  folderPath?: string; // If undefined, searches all files in database
  limit?: number;
  continuation?: string;
  orderBy?: {
    field: "startTime" | "lastFrame";
    direction?: "asc" | "desc";
  };
  filters?: ReplayFilter[];
};

export type SearchGamesResult = {
  files: FileResult[];
  continuation: string | undefined;
  totalCount?: number;
};

export type BulkDeleteOptions = {
  folderPath?: string; // If undefined, searches all files in database
  filters?: ReplayFilter[];
  excludeFilePaths?: string[];
};

export type BulkDeleteResult = {
  deletedCount: number;
};

export interface ReplayService {
  initializeFolderTree(folders: readonly string[]): Promise<readonly FolderResult[]>;
  selectTreeFolder(folderPath: string): Promise<readonly FolderResult[]>;
  searchGames(options: SearchGamesOptions): Promise<SearchGamesResult>;
  getAllFilePaths(options: SearchGamesOptions): Promise<string[]>;
  calculateGameStats(filePath: string): Promise<{ file: FileResult; stats: StatsType | undefined }>;
  calculateStadiumStats(filePath: string): Promise<{ file: FileResult; stadiumStats: StadiumStatsType | undefined }>;
  deleteReplays(fileIds: string[]): Promise<void>;
  bulkDeleteReplays(options: BulkDeleteOptions): Promise<BulkDeleteResult>;
  onReplayLoadProgressUpdate(handle: (progress: Progress) => void): () => void;
  onStatsPageRequest(handle: (filePath: string) => void): () => void;
}
