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
  gameStation?: string;
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
  latestVersion?: string;
}

export enum DolphinEventType {
  CLOSED = "CLOSED",
  DOWNLOAD_PROGRESS = "DOWNLOAD_PROGRESS",
  DOWNLOAD_COMPLETE = "DOWNLOAD_COMPLETE",
}

export type DolphinNetplayClosedEvent = {
  type: DolphinEventType.CLOSED;
  dolphinType: DolphinLaunchType.NETPLAY;
  exitCode: number | null;
};

export type DolphinPlaybackClosedEvent = {
  type: DolphinEventType.CLOSED;
  dolphinType: DolphinLaunchType.PLAYBACK;
  instanceId: string;
  exitCode: number | null;
};

export type DolphinDownloadProgressEvent = {
  type: DolphinEventType.DOWNLOAD_PROGRESS;
  dolphinType: DolphinLaunchType;
  progress: {
    current: number;
    total: number;
  };
};

export type DolphinDownloadCompleteEvent = {
  type: DolphinEventType.DOWNLOAD_COMPLETE;
  dolphinType: DolphinLaunchType;
};

export type DolphinEventMap = {
  [DolphinEventType.CLOSED]: DolphinNetplayClosedEvent | DolphinPlaybackClosedEvent;
  [DolphinEventType.DOWNLOAD_PROGRESS]: DolphinDownloadProgressEvent;
  [DolphinEventType.DOWNLOAD_COMPLETE]: DolphinDownloadCompleteEvent;
};

export type DolphinEvent = DolphinEventMap[DolphinEventType];

export interface DolphinService {
  downloadDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  configureDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  softResetDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  hardResetDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  storePlayKeyFile(key: PlayKey): Promise<void>;
  checkPlayKeyExists(key: PlayKey): Promise<boolean>;
  removePlayKeyFile(): Promise<void>;
  viewSlpReplay(files: ReplayQueueItem[]): Promise<void>;
  launchNetplayDolphin(options: { bootToCss?: boolean }): Promise<void>;
  checkDesktopAppDolphin(): Promise<{ dolphinPath: string; exists: boolean }>;
  importDolphinSettings(options: { toImportDolphinPath: string; dolphinType: DolphinLaunchType }): Promise<void>;
  onEvent<T extends DolphinEventType>(eventType: T, handle: (event: DolphinEventMap[T]) => void): () => void;
}
