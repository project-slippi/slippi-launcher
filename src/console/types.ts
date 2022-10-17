import type { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import type { AutoSwitcher } from "./autoSwitcher";
import type { ConsoleRelay } from "./consoleRelay";

export interface ConsoleMirrorStatusUpdate {
  status: number;
  isMirroring: boolean;
  filename: string | null;
  nickname: string;
  nintendontVersion: string | null;
}

export interface MirrorConfig {
  id: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealtime: boolean;
  enableRelay: boolean;
  autoSwitcherSettings?: AutoSwitcherSettings;
  useNicknameFolders: boolean;
  nickname?: string;
}

export interface MirrorDetails extends MirrorConfig {
  isMirroring: boolean;
  connection: ConsoleConnection;
  fileWriter: SlpFileWriter;
  autoSwitcher: AutoSwitcher | null;
  relay: ConsoleRelay | null;
}

export interface AutoSwitcherSettings {
  sourceName: string;
  ip: string;
  port: string;
  password?: string;
}

export interface DiscoveredConsoleInfo {
  ip: string;
  mac: string;
  name: string | undefined;
  firstFound: string;
}

export enum MirrorEvent {
  LOG = "LOG",
  ERROR = "ERROR",
  NEW_FILE = "NEW_FILE",
  MIRROR_STATUS_CHANGE = "MIRROR_STATUS_CHANGE",
}

export interface ConsoleService {
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
}
