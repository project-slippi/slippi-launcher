import broadcastApi from "@broadcast/api";
import consoleApi from "@console/api";
import dolphinApi from "@dolphin/api";
import replaysApi from "@replays/api";
import settingsApi from "@settings/api";
import { clipboard, contextBridge, shell } from "electron";
import path from "path";
import { isSubdirectory } from "utils/isSubdirectory";

import commonApi from "./api";
import { getConfigFlags } from "./flags";

const isDevelopment = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

const api = {
  flags: getConfigFlags(isDevelopment),
  common: commonApi,
  console: consoleApi,
  settings: settingsApi,
  broadcast: broadcastApi,
  dolphin: dolphinApi,
  replays: replaysApi,
  utils: {
    isSubdirectory,
  },
  path: {
    join: path.join,
  },
  clipboard: {
    writeText: clipboard.writeText,
    readText: clipboard.readText,
  },
  shell: {
    openPath: shell.openPath,
    showItemInFolder: shell.showItemInFolder,
  },
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
