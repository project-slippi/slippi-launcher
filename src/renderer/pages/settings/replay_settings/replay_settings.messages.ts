export const ReplaySettingsMessages = {
  rootSlpFolder: () => "Root SLP Folder",
  rootSlpFolderDescription: () => "The folder where your SLP replays should be saved.",

  saveReplaysToMonthlySubfolders: (currentDate: string) =>
    "Save replays to monthly subfolders in YYYY-MM format (e.g. {0})",

  closeDolphinToChangeSetting: () => "Close Dolphin to change this setting",
  noFolderSet: () => "No folder set",

  spectatorSlpFolder: () => "Spectator SLP Folder",
  spectatorSlpFolderDescription: () => "The folder where spectated games should be saved.",
  additionalSlpFolders: () => "Additional SLP Folders",
  additionalSlpFoldersDescription: () => "Choose any additional SLP folders that should show up in the replay browser.",

  enableNetplayReplays: () => "Enable Netplay Replays",
  enableNetplayReplaysDescription: () => "Save replays for netplay games to the Root SLP Folder",
};
