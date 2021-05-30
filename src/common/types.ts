import { GameStartType, MetadataType, StatsType } from "@slippi/slippi-js";

export interface FileResult {
  name: string;
  fullPath: string;
  settings: GameStartType;
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

export interface NewsItem {
  id: string;
  title: string;
  permalink: string;
  publishedAt: string; // ISO string
  subtitle?: string;
  imageUrl?: string;
  body?: string;
}

export enum BroadcastEvent {
  slippiStatusChange = "slippiStatusChange",
  dolphinStatusChange = "dolphinStatusChange",
  error = "broadcastError",
}

export interface StartBroadcastConfig {
  ip: string;
  port: number;
  viewerId: string;
  authToken: string;
}

export interface BroadcasterItem {
  broadcaster: {
    name: string;
    uid: string;
  };
  id: string;
  name: string;
}
