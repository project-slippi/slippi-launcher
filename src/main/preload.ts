import broadcast from "@broadcast/api";
import console from "@console/api";
import dolphin from "@dolphin/api";
import replays from "@replays/api";
import settings from "@settings/api";
import type { IpcRendererEvent } from "electron";
import { clipboard, contextBridge, ipcRenderer, shell } from "electron";
import path from "path";

import common from "./api";

type IpcEventListener = (event: IpcRendererEvent, ...args: any[]) => void;

const validChannels = ["ipc-example", "counter-changed"];

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
  ipcRenderer: {
    myPing() {
      ipcRenderer.send("ipc-example", "ping");
    },
    on(channel: string, func: any) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        const subscription: IpcEventListener = (_event, ...args) => func(...args);
        ipcRenderer.on(channel, subscription);
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      return () => void 0;
    },
    once(channel: string, func: any) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
  },
};

contextBridge.exposeInMainWorld("electron", api);

export type API = typeof api;
