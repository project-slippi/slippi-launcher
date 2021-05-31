// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import { FileResult } from "common/types";
import { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

import {
  connect,
  deleteReplays,
  getFolderFiles,
  getFolderReplays,
  getFullReplay,
  pruneFolders,
  saveReplays,
} from "./db";

export interface Methods {
  connect(path: string): void;
  getFolderFiles(folder: string): Promise<string[]>;
  getFolderReplays(folder: string): Promise<FileResult[]>;
  getFullReplay(file: string): Promise<FileResult | null>;
  // getPlayerReplays(_: string): Promise<FileResult[]>;
  saveReplays(replays: FileResult[]): Promise<void>;
  deleteReplays(files: string[]): Promise<void>;
  pruneFolders(existingFolders: string[]): Promise<void>;
}

export type WorkerSpec = ModuleMethods & Methods;

const methods: WorkerSpec = {
  connect(path: string) {
    connect(path);
  },
  async getFolderFiles(folder: string): Promise<string[]> {
    return getFolderFiles(folder);
  },
  async getFolderReplays(folder: string) {
    return getFolderReplays(folder);
  },
  async getFullReplay(file: string): Promise<FileResult | null> {
    return getFullReplay(file);
  },
  // async getPlayerReplays(player: string): Promise<FileResult[]> {
  //   return getPlayerReplays(player)
  // },
  async saveReplays(replays: FileResult[]): Promise<void> {
    return saveReplays(replays);
  },
  async deleteReplays(files: string[]): Promise<void> {
    return deleteReplays(files);
  },
  async pruneFolders(existingFolders: string[]): Promise<void> {
    return pruneFolders(existingFolders);
  },
};

expose(methods);
