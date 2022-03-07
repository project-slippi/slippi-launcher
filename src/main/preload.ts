import broadcast from "@broadcast/api";
import console from "@console/api";
import dolphin from "@dolphin/api";
import replays from "@replays/api";
import settings from "@settings/api";
import { clipboard, contextBridge, shell } from "electron";
import path from "path";

import common from "./api";

const api = {
  common,
  console,
  settings,
  broadcast,
  dolphin,
  replays,
  path: {
    sep: path.sep,
    basename: path.basename,
    resolve: path.resolve,
    relative: path.relative,
    join: path.join,
  },
  clipboard: {
    writeText: clipboard.writeText,
    readText: clipboard.readText,
  },
  shell: {
    openPath: shell.openPath,
    showItemInFolder: shell.showItemInFolder,
    trashItem: shell.trashItem,
  },
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
