// Re-export the ConnectionStatus type from slippi-js/node so that the renderer can use it
export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  RECONNECT_WAIT = 3,
}

export enum Ports {
  DEFAULT = 51441,
  LEGACY = 666,
  RELAY_START = 53741,
}

export type ConsoleMirrorStatusUpdate = {
  status: number;
  isMirroring: boolean;
  filename: string | null;
  nickname: string;
  nintendontVersion: string | null;
};

export type MirrorConfig = {
  id: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealtime: boolean;
  enableRelay: boolean;
  autoSwitcherSettings?: AutoSwitcherSettings;
  useNicknameFolders: boolean;
  nickname?: string;
};

export type AutoSwitcherSettings = {
  sourceName: string;
  ip: string;
  port: string;
  password?: string;
};

export type DiscoveredConsoleInfo = {
  ip: string;
  mac: string;
  name: string | undefined;
  firstFound: string;
};

export enum MirrorEvent {
  LOG = "LOG",
  ERROR = "ERROR",
  NEW_FILE = "NEW_FILE",
  MIRROR_STATUS_CHANGE = "MIRROR_STATUS_CHANGE",
}

export type ConsoleService = {
  connectToConsoleMirror(config: MirrorConfig): Promise<void>;
  disconnectFromConsole(ip: string): Promise<void>;
  startMirroring(ip: string): Promise<void>;
  startDiscovery(): Promise<void>;
  stopDiscovery(): Promise<void>;
  onDiscoveredConsolesUpdated(handle: (consoles: DiscoveredConsoleInfo[]) => void): () => void;
  onConsoleMirrorErrorMessage(handle: (message: string) => void): () => void;
  onConsoleMirrorStatusUpdated(
    handle: (result: { ip: string; info: Partial<ConsoleMirrorStatusUpdate> }) => void,
  ): () => void;
};
