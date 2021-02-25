import { ipcRenderer } from "electron";

import { FileResult } from "./types";

export function loadReplays() {
  return new Promise<FileResult[]>((resolve) => {
    ipcRenderer.once("load-replays", (_: any, arg: FileResult[]) => {
      resolve(arg);
    });
    ipcRenderer.send("load-replays");
  });
}

export function loadPlayerReplays(player: string) {
  return new Promise<FileResult[]>((resolve) => {
    ipcRenderer.once("load-player-replays", (_: any, arg: FileResult[]) => {
      resolve(arg);
    });
    ipcRenderer.send("load-player-replays", player);
  });
}

export async function saveReplay(replay: FileResult) {
  return new Promise<void>((resolve, reject) => {
    ipcRenderer.once("save-replay", (_: any, err: string | null) => {
      if (err !== null) {
        reject(err);
      }
      resolve();
    });
    ipcRenderer.send("save-replay", replay);
  });
}
