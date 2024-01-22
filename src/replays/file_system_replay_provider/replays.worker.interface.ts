import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import type { WorkerSpec } from "./replays.worker";

export type ReplayWorker = RegisteredWorker<WorkerSpec>;

const log = electronLog.scope("replays.worker");

export async function createReplayWorker(): Promise<ReplayWorker> {
  log.debug("replays: Spawning worker");

  const replayWorker = await registerWorker<WorkerSpec>(new Worker("./replays.worker"));
  log.debug("replays: Spawning worker: Done");

  return replayWorker;
}
