export type StoredConnection = {
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
};

export type AppSettings = {
  previousVersion?: string;
  connections: StoredConnection[];
  settings: {
    isoPath: string | null;
    rootSlpPath: string;
    useMonthlySubfolders: boolean;
    enableJukebox: boolean;
    spectateSlpPath: string;
    extraSlpPaths: string[];
    launchMeleeOnPlay: boolean;
    autoUpdateLauncher: boolean;
    dolphin: {
      netplay: {
        betaAvailable: boolean;
        useBeta: boolean;
        promoteToStable: boolean;
      };
      playback: {
        betaAvailable: boolean;
        useBeta: boolean;
        promoteToStable: boolean;
      };
    };
  };
};
