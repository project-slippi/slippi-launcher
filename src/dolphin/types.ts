export interface ReplayCommunication {
  mode: "normal" | "mirror" | "queue"; // default normal
  replay?: string; // path to the replay if in normal or mirror mode
  startFrame?: number; // when to start watching the replay
  endFrame?: number; // when to stop watching the replay
  commandId?: string; // random string, doesn't really matter
  outputOverlayFiles?: boolean; // outputs gameStartAt and gameStation to text files (only works in queue mode)
  isRealTimeMode?: boolean; // default false; keeps dolphin fairly close to real time (about 2-3 frames); only relevant in mirror mode
  shouldResync?: boolean; // default true; disables the resync functionality
  rollbackDisplayMethod?: "off" | "normal" | "visible"; // default off; normal shows like a player experienced it, visible shows ALL frames (normal and rollback)
  queue?: ReplayQueueItem[];
}

export interface ReplayQueueItem {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStartAt?: string;
  gameStation?: string;
}

export enum DolphinLaunchType {
  NETPLAY = "netplay",
  PLAYBACK = "playback",
}

export enum DolphinUseType {
  PLAYBACK = "playback",
  SPECTATE = "spectate",
  CONFIG = "config",
  NETPLAY = "netplay",
}

export interface PlayKey {
  uid: string;
  playKey: string;
  connectCode: string;
  displayName: string;
  latestVersion: string;
}

export interface DolphinVersionResponse {
  version: string;
  downloadUrls: {
    darwin: string;
    linux: string;
    win32: string;
  };
}
