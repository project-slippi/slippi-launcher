import { Worker } from "threads";
import type { RegisteredWorker } from "utils/register_worker";
import { registerWorker } from "utils/register_worker";

import type {
  ParsedFileInfo as WorkerParsedFileInfo,
  WorkerSpec as ReplayIndexingWorkerSpec,
} from "./replay_indexing.worker";

export type ReplayIndexingWorker = RegisteredWorker<ReplayIndexingWorkerSpec>;
export type ParsedFileInfo = WorkerParsedFileInfo;

export async function createReplayIndexingWorker(workerName: string): Promise<ReplayIndexingWorker> {
  const worker = await registerWorker<ReplayIndexingWorkerSpec>(workerName, new Worker("./replay_indexing.worker"));
  return worker;
}
