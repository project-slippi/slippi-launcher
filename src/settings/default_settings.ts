import { app } from "electron";
import log from "electron-log";
import path from "path";

import type { AppSettings } from "./types";

function getDefaultRootSlpPath(): string {
  let root = app.getPath("home");
  if (process.platform === "win32") {
    try {
      root = app.getPath("documents");
    } catch {
      // there are rare cases where documents isn't defined so just use home instead
      log.error("Couldn't get the documents path");
    }
  }
  return path.join(root, "Slippi");
}

export const defaultAppSettings: AppSettings = {
  connections: [],
  settings: {
    isoPath: null,
    rootSlpPath: getDefaultRootSlpPath(),
    useMonthlySubfolders: true,
    enableJukebox: true,
    spectateSlpPath: path.join(getDefaultRootSlpPath(), "Spectate"),
    extraSlpPaths: [],
    launchMeleeOnPlay: true,
    autoUpdateLauncher: true,
    useNetplayBeta: false,
    usePlaybackBeta: false,
    enableSpectateRemoteControl: false,
    spectateRemoteControlPort: 49809,
  },
  netplayPromotedToStable: false,
  playbackPromotedToStable: false,
};
