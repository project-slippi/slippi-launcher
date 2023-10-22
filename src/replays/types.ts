import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";

export type PlayerInfo = {
  playerIndex: number;
  port: number;
  type?: number;
  characterId?: number;
  characterColor?: number;
  teamId?: number;
  isWinner?: boolean;
  connectCode?: string;
  displayName?: string;
  tag?: string;
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
  stageId?: number;
  startTime?: string;
  platform?: string;
  consoleNickname?: string;
  mode?: number;
  lastFrame?: number;
  timerType?: number;
  startingTimerSeconds?: number;
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
