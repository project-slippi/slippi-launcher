import broadcastApi from "@broadcast/api";
import consoleApi from "@console/api";
import dolphinApi from "@dolphin/api";
import replaysApi from "@replays/api";
import settingsApi from "@settings/api";
import { clipboard, contextBridge, shell } from "electron";
import log from "electron-log";
import path from "path";

import commonApi from "./api";

const api = {
  common: commonApi,
  console: consoleApi,
  settings: settingsApi,
  broadcast: broadcastApi,
  dolphin: dolphinApi,
  replays: replaysApi,
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
  log: log.functions,
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
