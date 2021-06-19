import { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import { AutoSwitcher } from "./autoSwitcher";

export interface MirrorConfig {
  id?: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode: boolean;
  autoSwitcherSettings?: AutoSwitcherSettings | null;
}

export interface MirrorDetails extends MirrorConfig {
  isMirroring?: boolean;
  connection?: ConsoleConnection | null;
  fileWriter?: SlpFileWriter | null;
  autoSwitcher?: AutoSwitcher | null;
}

export interface AutoSwitcherSettings {
  sourceName: string;
  ip: string;
  password?: string;
}
