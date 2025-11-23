export const AddConnectionFormMessages = {
  ipAddress: () => "IP Address",
  targetFolder: () => "Target Folder",
  targetFolderDescription: () => "The folder to save SLP files to.",
  targetFolderPlaceholder: () => "No folder selected",
  saveReplaysToSubfolders: () => "Save replays to subfolders based on console nickname",
  enableRealTimeMode: () => "Enable Real-time Mode",
  enableRealTimeModeDescription: () =>
    "Prevents delay from accumulating when mirroring. Keep this off unless both the Wii and computer are on a wired LAN connection.",
  showAdvancedOptions: () => "Show advanced options",
  hideAdvancedOptions: () => "Hide advanced options",
  onlyModifyIfYouKnowWhatYouAreDoing: () => "Only modify these values if you know what you're doing.",
  enableAutoswitcher: () => "Enable Autoswitcher",
  enableAutoswitcherDescription: () =>
    "Allows automatic hiding and showing of an OBS source (e.g. your Dolphin capture) when the game is active. " +
    "Requires OBS Websocket 5.0+, which comes preinstalled on OBS 28+.",
  download: () => "Download",
  obsWebsocketIP: () => "OBS Websocket IP",
  obsWebsocketPort: () => "OBS Websocket Port",
  invalidPort: () => "Invalid Port",
  obsPassword: () => "OBS Password",
  obsSourceName: () => "OBS Source Name",
  enableRelay: () => "Enable Console Relay",
  enableRelayDescription: () => "Allows external programs to read live game data by connecting to a local endpoint.",
  connectionPort: () => "Connection Port",
  connectionPortDescription: (defaultPort: number) =>
    "The port used for connecting to console. Only change this if connecting to a Console Relay. If unsure, leave it as {0}.",
  port: () => "Port",
  invalidPortNumber: () => "Invalid port number",
  submit: () => "Submit",
};
