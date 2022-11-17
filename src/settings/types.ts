export interface StoredConnection {
  id: number;
  ipAddress: string;
  folderPath: string;
  isRealtime: boolean;
  port?: number;
  consoleNick?: string;
  enableAutoSwitcher: boolean;
  obsIP?: string;
  obsPort?: string;
  obsSourceName?: string;
  obsPassword?: string;
  enableRelay: boolean;
  useNicknameFolders: boolean;
}

export type AppSettings = {
  previousVersion?: string;
  connections: StoredConnection[];
  settings: {
    isoPath: string | null;
    rootSlpPath: string;
    useMonthlySubfolders: boolean;
    spectateSlpPath: string;
    extraSlpPaths: string[];
    netplayDolphinPath: string;
    playbackDolphinPath: string;
    launchMeleeOnPlay: boolean;
    autoUpdateLauncher: boolean;
  };
};
