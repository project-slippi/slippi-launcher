import { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import { AutoSwitcher } from "./autoSwitcher";
import { ConsoleRelay } from "./consoleRelay";

export interface ConsoleMirrorStatusUpdate {
  status: number;
  filename: string | null;
  nickname: string;
}

export interface MirrorConfig {
  id: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode?: boolean;
  enableRelay?: boolean;
  autoSwitcherSettings?: AutoSwitcherSettings;
}

export interface MirrorDetails extends MirrorConfig {
  isMirroring?: boolean;
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
