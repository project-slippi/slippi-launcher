import broadcastApi from "@broadcast/api";
import consoleApi from "@console/api";
import dolphinApi from "@dolphin/api";
import remoteApi from "@remote/api";
import replaysApi from "@replays/api";
import settingsApi from "@settings/api";
import { clipboard, contextBridge, ipcRenderer, shell } from "electron";
import path from "path";
import { isSubdirectory } from "utils/is_subdirectory";

import commonApi from "./api";
import type { AppBootstrap } from "./bootstrap";

const api = {
  bootstrap: ipcRenderer.sendSync("getAppBootstrapSync") as AppBootstrap,
  common: commonApi,
  console: consoleApi,
  settings: settingsApi,
  broadcast: broadcastApi,
  dolphin: dolphinApi,
  replays: replaysApi,
  remote: remoteApi,
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
    openExternal: shell.openExternal,
    showItemInFolder: shell.showItemInFolder,
  },
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
