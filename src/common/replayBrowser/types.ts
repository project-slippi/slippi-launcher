import { GameStartType, MetadataType, PlayerType, StatsType, StockType } from "@slippi/slippi-js";

export interface FullPlayerType extends PlayerType {
  endStocks: number;
  stocks: StockType[];
}

export interface FullGameStartType extends GameStartType {
  players: FullPlayerType[];
}

export interface FileResult {
  name: string;
  fullPath: string;
  settings: FullGameStartType;
  startTime: string | null;
  lastFrame: number | null;
  metadata: MetadataType | null;
  stats: StatsType | null;
  playerCount: number | null;
  player1: string | null;
  player2: string | null;
  player3: string | null;
  player4: string | null;
  folder: string;
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
