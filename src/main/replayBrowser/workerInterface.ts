import { app } from "electron";
import log from "electron-log";
import os from "os";
import { Pool as spawnPool, spawn, Worker } from "threads";

import { WorkerSpec } from "./worker";

const workerPool = spawnPool(() => spawn<WorkerSpec>(new Worker("./worker")), os.cpus().length);
log.debug("replayBrowser: Spawning pool");

async function terminatePool() {
  log.debug("replayBrowser: Terminating pool");
  await workerPool.terminate();
}
app.on("quit", terminatePool);

export const loadReplayFile = async (fullPath: string) => await workerPool.queue((w) => w.loadReplayFile(fullPath));

export const loadReplays = async (files: string[], progressCallback: (count: number) => void) => {
  let count = 0;
  const parsed = await Promise.all(
    files.map(async (file) => {
      const res = await loadReplayFile(file);
      progressCallback(count++);
      return res;
    }),
  );
  return parsed.filter((f) => f);
};
