import type { SyncedDolphinSettings } from "./config/config";
import type { GeckoCode } from "./config/gecko_code";
import type { DolphinVersionResponse } from "./install/fetch_latest_version";

export type ReplayCommunication = {
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
};

export type ReplayQueueItem = {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStartAt?: string;
  gameStation?: string;
};

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

export type PlayKey = {
  uid: string;
  playKey: string;
  connectCode: string;
  displayName: string;
  latestVersion?: string;
};

export enum DolphinEventType {
  CLOSED = "CLOSED",
  DOWNLOAD_START = "DOWNLOAD_START",
  DOWNLOAD_PROGRESS = "DOWNLOAD_PROGRESS",
  DOWNLOAD_COMPLETE = "DOWNLOAD_COMPLETE",
  OFFLINE = "OFFLINE",
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

export type DolphinDownloadStartEvent = {
  type: DolphinEventType.DOWNLOAD_START;
  dolphinType: DolphinLaunchType;
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
  dolphinVersion: string | null;
};

export type DolphinOfflineEvent = {
  type: DolphinEventType.OFFLINE;
  dolphinType: DolphinLaunchType;
};

export type DolphinEventMap = {
  [DolphinEventType.CLOSED]: DolphinNetplayClosedEvent | DolphinPlaybackClosedEvent;
  [DolphinEventType.DOWNLOAD_START]: DolphinDownloadStartEvent;
  [DolphinEventType.DOWNLOAD_PROGRESS]: DolphinDownloadProgressEvent;
  [DolphinEventType.DOWNLOAD_COMPLETE]: DolphinDownloadCompleteEvent;
  [DolphinEventType.OFFLINE]: DolphinOfflineEvent;
};

export type DolphinEvent = DolphinEventMap[DolphinEventType];

export interface DolphinService {
  downloadDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  configureDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  softResetDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  hardResetDolphin(dolphinType: DolphinLaunchType): Promise<void>;
  openDolphinSettingsFolder(dolphinType: DolphinLaunchType): Promise<void>;
  storePlayKeyFile(key: PlayKey): Promise<void>;
  checkPlayKeyExists(key: PlayKey): Promise<boolean>;
  removePlayKeyFile(): Promise<void>;
  viewSlpReplay(files: ReplayQueueItem[]): Promise<void>;
  launchNetplayDolphin(options: { bootToCss?: boolean }): Promise<void>;
  checkDesktopAppDolphin(): Promise<{ dolphinPath: string; exists: boolean }>;
  importDolphinSettings(options: { toImportDolphinPath: string; dolphinType: DolphinLaunchType }): Promise<void>;
  fetchGeckoCodes(dolphinLaunchType: DolphinLaunchType): Promise<GeckoCode[]>;
  saveGeckoCodes(dolphinLaunchType: DolphinLaunchType, geckoCodes: GeckoCode[]): Promise<void>;
  onEvent<T extends DolphinEventType>(eventType: T, handle: (event: DolphinEventMap[T]) => void): () => void;
}

export interface DolphinInstallation {
  readonly installationFolder: string;
  get userFolder(): string;
  get sysFolder(): string;

  findDolphinExecutable(): Promise<string>;
  clearCache(): Promise<void>;
  importConfig(fromPath: string): Promise<void>;
  validate(options: {
    onStart: () => void;
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
    dolphinDownloadInfo: DolphinVersionResponse;
  }): Promise<void>;
  downloadAndInstall(options: {
    dolphinDownloadInfo: DolphinVersionResponse;
    onProgress?: (current: number, total: number) => void;
    onComplete?: () => void;
    cleanInstall?: boolean;
  }): Promise<void>;
  addGamePath(gameDir: string): Promise<void>;
  getSettings(): Promise<SyncedDolphinSettings>;
  updateSettings(options: Partial<SyncedDolphinSettings>): Promise<void>;
  getDolphinVersion(): Promise<string | null>;
  findPlayKey(): Promise<string>;
}
