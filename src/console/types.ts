import { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import { AutoSwitcher } from "./autoSwitcher";

export interface MirrorConfig {
  id?: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode?: boolean;
  autoSwitcherSettings?: AutoSwitcherSettings;
}

export interface MirrorDetails extends MirrorConfig {
  isMirroring?: boolean;
  connection: ConsoleConnection;
  fileWriter: SlpFileWriter;
  autoSwitcher: AutoSwitcher | null;
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
