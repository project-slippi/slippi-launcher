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
  id: string;
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
  loadFile(filePath: string): Promise<FileResult>;
  loadFolder(folder: string, onProgress?: (progress: Progress) => void): Promise<FileLoadResult>;
  calculateGameStats(fullPath: string): Promise<StatsType | null>;
  calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null>;
}
