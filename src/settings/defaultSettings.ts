import { app } from "electron";
import path from "path";

import type { AppSettings } from "./types";

function getDefaultRootSlpPath(): string {
  let root = app.getPath("home");
  if (process.platform === "win32") {
    root = app.getPath("documents");
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
