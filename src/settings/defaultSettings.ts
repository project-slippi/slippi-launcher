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
    useMonthlySubfolders: false,
    spectateSlpPath: path.join(getDefaultRootSlpPath(), "Spectate"),
    extraSlpPaths: [],
    netplayDolphinPath: path.join(app.getPath("userData"), "netplay"),
    playbackDolphinPath: path.join(app.getPath("userData"), "playback"),
    launchMeleeOnPlay: true,
    autoUpdateLauncher: true,
  },
};
