import { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import { AutoSwitcher } from "./autoSwitcher";
import { ConsoleRelay } from "./consoleRelay";

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
