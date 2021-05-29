export interface StoredConnection {
  id: number;
  ipAddress: string;
  folderPath: string;
  isRealTimeMode: boolean;
  consoleNick: string;
}

export type AppSettings = {
  previousVersion?: string;
  connections: StoredConnection[];
  settings: {
    isoPath?: string;
    rootSlpPath: string;
    spectateSlpPath: string;
    netplayDolphinPath: string;
    playbackDolphinPath: string;
  };
};
