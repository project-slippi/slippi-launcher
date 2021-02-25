import { ipcRenderer } from "electron";

import { FileResult } from "./types";

export function loadReplays(folder: string) {
  return new Promise<FileResult[]>((resolve) => {
    ipcRenderer.once("load-replays", (_: any, arg: FileResult[]) => {
      resolve(arg);
    });
    ipcRenderer.send("load-replays", folder);
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
export async function deleteReplays(replays: string[]) {
  return new Promise<void>((resolve, reject) => {
    ipcRenderer.once("delete-replays", (_: any, err: string | null) => {
      if (err !== null) {
        reject(err);
      }
      resolve();
    });
    ipcRenderer.send("delete-replays", replays);
  });
}
