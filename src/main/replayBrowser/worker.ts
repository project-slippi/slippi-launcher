// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import { FileResult } from "common/types";
import { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

import { loadFile } from "./loadFile";

export interface Methods {
  loadReplayFile(fullPath: string): Promise<FileResult | null>;
  destroyWorker: () => Promise<void>;
}

export type WorkerSpec = ModuleMethods & Methods;

const methods: WorkerSpec = {
  async loadReplayFile(fullPath: string): Promise<FileResult | null> {
    try {
      return await loadFile(fullPath);
    } catch (err) {
      return null; // File load failed, should be filtered
    }
  },
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },
};

expose(methods);
