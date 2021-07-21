// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

import { BroadcastManager } from "./broadcastManager";
import { StartBroadcastConfig } from "./types";

export interface Methods {
  destroyWorker: () => Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
}

export type WorkerSpec = ModuleMethods & Methods;

const broadcastManager = new BroadcastManager();

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },
  async startBroadcast(config: StartBroadcastConfig): Promise<void> {
    await broadcastManager.start(config);
  },
  async stopBroadcast(): Promise<void> {
    await broadcastManager.stop();
  },
};

expose(methods);
