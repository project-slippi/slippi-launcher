import { ConsoleConnection, SlpFileWriter } from "@slippi/slippi-js";

import { OBSManager } from "./autoSwitcher";

export interface MirrorDetails {
  id?: number;
  ipAddress: string;
  port: number;
  folderPath: string;
  isRealTimeMode: boolean;
  isRelaying?: boolean;
  connection?: ConsoleConnection | null;
  fileWriter?: SlpFileWriter | null;
  isMirroring?: boolean;
  obsSettings?: OBSSettings | null;
  obsManager?: OBSManager | null;
}

export interface OBSSettings {
  sourceName: string;
  ip: string;
  password?: string;
}
