import { ipcRenderer } from "electron";

import { FileResult } from "./types";

export function loadReplays(folder: string) {
  return new Promise<FileResult[]>((resolve, reject) => {
    ipcRenderer.once("load-replays", (_: any, arg: Error | FileResult[]) => {
      if (arg instanceof Error) {
        reject(arg);
      }
      resolve(arg as FileResult[]);
    });
    ipcRenderer.send("load-replays", folder);
  });
}

export function loadReplayFile(file: string) {
  return new Promise<FileResult>((resolve, reject) => {
    ipcRenderer.once("load-replay-file", (_: any, arg: Error | FileResult) => {
      if (arg instanceof Error) {
        reject(arg);
      }
      resolve(arg as FileResult);
    });
    ipcRenderer.send("load-replay-file", file);
  });
}

export function loadPlayerReplays(player: string) {
  return new Promise<FileResult[]>((resolve, reject) => {
    ipcRenderer.once("load-player-replays", (_: any, arg: Error | FileResult[]) => {
      if (arg instanceof Error) {
        reject(arg);
      }
      resolve(arg as FileResult[]);
    });
    ipcRenderer.send("load-player-replays", player);
  });
}

export async function saveReplay(replay: FileResult) {
  return new Promise<void>((resolve, reject) => {
    ipcRenderer.once("save-replay", (_: any, err: Error | null) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
    ipcRenderer.send("save-replay", replay);
  });
}

export async function deleteReplays(replays: string[]) {
  return new Promise<void>((resolve, reject) => {
    ipcRenderer.once("delete-replays", (_: any, err: Error | null) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
    ipcRenderer.send("delete-replays", replays);
  });
}

export async function deleteFolderReplays(existingFolders: string[]) {
  return new Promise<void>((resolve, reject) => {
    ipcRenderer.once("delete-folders", (_: any, err: Error | null) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
    ipcRenderer.send("delete-folders", existingFolders);
  });
}
