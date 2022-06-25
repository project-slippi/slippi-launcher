import electronLog from "electron-log";
import { Worker } from "threads";
import type { RegisteredWorker } from "utils/registerWorker";
import { registerWorker } from "utils/registerWorker";

import type { WorkerSpec } from "./db.worker";

export type DatabaseWorker = RegisteredWorker<WorkerSpec>;

const log = electronLog.scope("db.worker");

export async function createDatabaseWorker(databasePath: string): Promise<DatabaseWorker> {
  log.debug("Spawning worker");

  const worker = await registerWorker<WorkerSpec>(new Worker("./db.worker"));
  log.debug("Spawning worker: Done");

  worker.connect(databasePath);
  log.debug("Spawning worker: Connected to database");

  return worker;
}

// w.connect(path.join(app.getPath("userData"), "sqlippi.db"));
// resolve(worker);
