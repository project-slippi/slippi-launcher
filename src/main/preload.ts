import broadcastApi from "@broadcast/api";
import consoleApi from "@console/api";
import dolphinApi from "@dolphin/api";
import spectateRemoteApi from "@remote/api";
import replaysApi from "@replays/api";
import settingsApi from "@settings/api";
import { contextBridge, ipcRenderer, shell, webUtils } from "electron";
import fs from "fs-extra";
import path from "path";
import { isSubdirectory } from "utils/is_subdirectory";

import commonApi from "./api";
import type { AppBootstrap } from "./bootstrap";

const bootstrap = ipcRenderer.sendSync("getAppBootstrapSync") as AppBootstrap;

const api = {
  bootstrap,
  common: commonApi,
  console: consoleApi,
  settings: settingsApi,
  broadcast: broadcastApi,
  dolphin: dolphinApi,
  replays: replaysApi,
  remote: spectateRemoteApi,
  utils: {
    isSubdirectory,
    pathExists: (folder: string) => fs.pathExists(folder),
    // This is needed since Electron won't return the full file path anymore
    getFilePath: (file: File): string => {
      // This returns the absolute path on disk
      return webUtils.getPathForFile(file);
    },
  },
  path: {
    join: path.join,
  },
  shell: {
    openPath: shell.openPath,
    openExternal: shell.openExternal,
    showItemInFolder: shell.showItemInFolder,
  },
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
