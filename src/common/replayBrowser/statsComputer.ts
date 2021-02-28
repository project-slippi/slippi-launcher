import os from "os";
import { Worker } from "worker_threads";
import { FileResult } from "common/replayBrowser";

export const parseReplays = (replays: FileResult[], progressCallback: (count: number) => void) => {
  return new Promise<FileResult[]>((resolve, reject) => {
    const cores = os.cpus().length;
    const results = [] as FileResult[];
    const batchSize = Math.ceil(replays.length / cores);
    let count = 0;
    for (let i = 0; i < cores; i++) {
      const start = i * batchSize;
      const end = Math.min(i * batchSize + batchSize, replays.length);
      const worker = new Worker("./src/common/replayBrowser/stats.worker.js", {
        workerData: replays.slice(start, end),
      });
      worker.on("message", (result) => {
        count++;
        results.push(result);
        progressCallback(count);
        if (count === replays.length) {
          resolve(results);
        }
      });
      worker.on("error", (err) => reject(err));
      worker.on("exit", (code) => (code !== 0 ? reject(`bad worker exit ${code}`) : null));
    }
  });
};
