import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import type {
  ParsedFileInfo as WorkerParsedFileInfo,
  WorkerSpec as ReplayIndexingWorkerSpec,
} from "./replay_indexing.worker";

const log = electronLog.scope("replay_indexing.worker");

export type ReplayIndexingWorker = RegisteredWorker<ReplayIndexingWorkerSpec>;
export type ParsedFileInfo = WorkerParsedFileInfo;

export async function createReplayIndexingWorker(): Promise<ReplayIndexingWorker> {
  log.debug("replay_indexing: Spawning worker");

  const worker = await registerWorker<ReplayIndexingWorkerSpec>(new Worker("./replay_indexing.worker"));
  log.debug("replay_indexing: Spawning worker: Done");

  return worker;
}
