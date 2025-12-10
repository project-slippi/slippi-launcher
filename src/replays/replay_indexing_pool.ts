import electronLog from "electron-log";
import * as os from "os";

import type { ParseFileResult } from "./replay_indexing.worker";
import type { ReplayIndexingWorker } from "./replay_indexing.worker.interface";
import { createReplayIndexingWorker } from "./replay_indexing.worker.interface";

const log = electronLog.scope("replay_indexing_pool");

/**
 * Pool of replay indexing workers for parallel file parsing
 */
export class ReplayIndexingPool {
  private workers: ReplayIndexingWorker[] = [];
  private workerPromises: Map<number, Promise<ParseFileResult[]>> = new Map();
  private nextWorkerIndex = 0;
  private isTerminated = false;

  constructor(private readonly poolSize: number) {}

  /**
   * Initialize the worker pool
   */
  public async initialize(): Promise<void> {
    log.info(`Initializing replay indexing pool with ${this.poolSize} workers`);

    const workerPromises = Array.from({ length: this.poolSize }, (_, i) =>
      createReplayIndexingWorker()
        .then((worker) => {
          log.debug(`Worker ${i + 1}/${this.poolSize} created successfully`);
          return worker;
        })
        .catch((err) => {
          log.error(`Failed to create worker ${i + 1}/${this.poolSize}:`, err);
          return null;
        }),
    );

    const workerResults = await Promise.all(workerPromises);
    this.workers = workerResults.filter((w): w is ReplayIndexingWorker => w !== null);

    if (this.workers.length === 0) {
      throw new Error("Failed to create any workers for the pool");
    }

    if (this.workers.length < this.poolSize) {
      log.warn(`Only ${this.workers.length}/${this.poolSize} workers created successfully`);
    } else {
      log.info(`Worker pool initialized with ${this.workers.length} workers`);
    }
  }

  /**
   * Parse a single replay file using the next available worker
   */
  public async parseReplayFile(folder: string, filename: string): Promise<ParseFileResult> {
    if (this.isTerminated) {
      throw new Error("Worker pool has been terminated");
    }

    if (this.workers.length === 0) {
      throw new Error("No workers available in pool");
    }

    const worker = this.getNextWorker();
    return await worker.parseReplayFile(folder, filename);
  }

  /**
   * Parse multiple replay files in parallel across all workers in the pool.
   * Files are distributed evenly across workers for optimal parallelization.
   */
  public async parseReplayFileBatch(folder: string, filenames: string[]): Promise<ParseFileResult[]> {
    if (this.isTerminated) {
      throw new Error("Worker pool has been terminated");
    }

    if (this.workers.length === 0) {
      throw new Error("No workers available in pool");
    }

    if (filenames.length === 0) {
      return [];
    }

    // If we have only one worker or very few files, just use a single worker
    if (this.workers.length === 1 || filenames.length <= 3) {
      return await this.workers[0].parseReplayFileBatch(folder, filenames);
    }

    // Distribute files across workers in round-robin fashion
    const workerBatches: string[][] = Array.from({ length: this.workers.length }, () => []);
    filenames.forEach((filename, index) => {
      const workerIndex = index % this.workers.length;
      workerBatches[workerIndex].push(filename);
    });

    // Filter out empty batches
    const nonEmptyBatches = workerBatches
      .map((batch, index) => ({ batch, workerIndex: index }))
      .filter(({ batch }) => batch.length > 0);

    log.debug(
      `Distributing ${filenames.length} files across ${nonEmptyBatches.length} workers (${nonEmptyBatches
        .map((b) => b.batch.length)
        .join(", ")} files each)`,
    );

    // Parse batches in parallel
    const parsePromises = nonEmptyBatches.map(({ batch, workerIndex }) => {
      const worker = this.workers[workerIndex];
      const promise = worker.parseReplayFileBatch(folder, batch);
      this.workerPromises.set(workerIndex, promise);
      return promise.finally(() => {
        this.workerPromises.delete(workerIndex);
      });
    });

    const results = await Promise.all(parsePromises);

    // Flatten results maintaining original order
    // We need to reconstruct the order since files were distributed round-robin
    const resultMap = new Map<string, ParseFileResult>();
    results.flat().forEach((result) => {
      resultMap.set(result.filename, result);
    });

    return filenames.map((filename) => resultMap.get(filename)!).filter(Boolean);
  }

  /**
   * Get the next worker in round-robin fashion
   */
  private getNextWorker(): ReplayIndexingWorker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Get the number of workers in the pool
   */
  public getPoolSize(): number {
    return this.workers.length;
  }

  /**
   * Terminate all workers in the pool
   */
  public async terminate(): Promise<void> {
    if (this.isTerminated) {
      return;
    }

    log.info("Terminating worker pool...");
    this.isTerminated = true;

    // Wait for any in-flight operations to complete
    if (this.workerPromises.size > 0) {
      log.debug(`Waiting for ${this.workerPromises.size} in-flight operations to complete...`);
      await Promise.allSettled(Array.from(this.workerPromises.values()));
    }

    // Terminate all workers
    const terminatePromises = this.workers.map((worker, index) =>
      worker
        .terminate()
        .then(() => {
          log.debug(`Worker ${index + 1} terminated`);
        })
        .catch((err) => {
          log.error(`Error terminating worker ${index + 1}:`, err);
        }),
    );

    await Promise.all(terminatePromises);
    this.workers = [];
    log.info("Worker pool terminated");
  }
}

/**
 * Create a replay indexing pool with optimal size based on CPU cores.
 * Uses (cores - 1) to leave one core for main thread and database operations,
 * with a minimum of 1 and maximum of 4 workers.
 */
export function createReplayIndexingPool(): ReplayIndexingPool {
  const cpuCount = os.cpus().length;
  // Use cores - 1, but at least 1 and at most 4 workers
  const poolSize = Math.max(1, Math.min(4, cpuCount - 1));
  log.info(`Creating replay indexing pool (CPU cores: ${cpuCount}, pool size: ${poolSize})`);
  return new ReplayIndexingPool(poolSize);
}
