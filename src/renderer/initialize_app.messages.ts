export const InitializeAppMessages = {
  failedToCommunicateWithSlippiServers: () => "Failed to communicate with Slippi servers.",
  youAreOffline: () => "You are offline.",
  slippiMayBeDown: () => `Slippi may be experiencing some downtime. Playing online may or may not work.`,
  failedToInstallDolphin: (dolphinTypeName: string) =>
    "Failed to install {0}. Try closing all Dolphin instances and restarting the launcher.",
  netplayDolphin: () => "Netplay Dolphin",
  playbackDolphin: () => "Playback Dolphin",
  updatedToVersion: (version: string) => `Slippi Launcher has been updated to version {0}`,
  updateFailed: (version: string) =>
    `Auto-update to version {0} failed. Try manually downloading the latest version from slippi.gg.`,
};
