import electronLog from "electron-log";

import type { ParseFileResult } from "./replay_indexing.worker";
import type { ReplayIndexingPool } from "./replay_indexing_pool";
import { createReplayIndexingPool } from "./replay_indexing_pool";

const log = electronLog.scope("replay_indexing_pool_manager");

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity before shutting down workers

/**
 * Manager for the replay indexing pool that implements lazy initialization
 * and automatic shutdown after idle timeout to save resources.
 */
export class ReplayIndexingPoolManager {
  private pool: ReplayIndexingPool | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  /**
   * Get or create the worker pool (lazy initialization)
   */
  private async ensurePool(): Promise<ReplayIndexingPool> {
    // Clear any pending idle timer since we're about to use the pool
    this.clearIdleTimer();

    // If pool exists and is healthy, return it
    if (this.pool && !this.isShuttingDown) {
      return this.pool;
    }

    // If shutdown is in progress, wait for it to complete
    if (this.isShuttingDown) {
      log.debug("Waiting for pool shutdown to complete before creating new pool");
      // Wait a bit for shutdown to complete (this should be rare)
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.pool && !this.isShuttingDown) {
        return this.pool;
      }
    }

    // Create new pool
    log.info("Creating worker pool on-demand");
    const pool = createReplayIndexingPool();
    await pool.initialize();
    this.pool = pool;
    return pool;
  }

  /**
   * Schedule automatic shutdown of idle workers
   */
  private scheduleIdleShutdown(): void {
    this.clearIdleTimer();

    this.idleTimer = setTimeout(async () => {
      if (this.pool && !this.isShuttingDown) {
        log.info(`Worker pool idle for ${IDLE_TIMEOUT_MS / 1000}s, shutting down to save resources`);
        await this.shutdownPool();
      }
    }, IDLE_TIMEOUT_MS);
  }

  /**
   * Clear the idle shutdown timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Shutdown the worker pool
   */
  private async shutdownPool(): Promise<void> {
    if (!this.pool || this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.clearIdleTimer();

    try {
      await this.pool.terminate();
      this.pool = null;
    } catch (err) {
      log.error("Error shutting down worker pool:", err);
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Parse a single replay file.
   * Creates worker pool on-demand if needed, schedules shutdown after idle timeout.
   */
  public async parseReplayFile(folder: string, filename: string): Promise<ParseFileResult> {
    try {
      const pool = await this.ensurePool();
      const result = await pool.parseReplayFile(folder, filename);
      this.scheduleIdleShutdown();
      return result;
    } catch (err) {
      log.error("Error parsing replay file:", err);
      throw err;
    }
  }

  /**
   * Parse multiple replay files in parallel.
   * Creates worker pool on-demand if needed, schedules shutdown after idle timeout.
   */
  public async parseReplayFileBatch(folder: string, filenames: string[]): Promise<ParseFileResult[]> {
    try {
      const pool = await this.ensurePool();
      const results = await pool.parseReplayFileBatch(folder, filenames);
      this.scheduleIdleShutdown();
      return results;
    } catch (err) {
      log.error("Error parsing replay file batch:", err);
      throw err;
    }
  }

  /**
   * Get the current pool size (0 if no pool exists)
   */
  public getPoolSize(): number {
    return this.pool?.getPoolSize() ?? 0;
  }

  /**
   * Check if pool is currently active
   */
  public isPoolActive(): boolean {
    return this.pool !== null && !this.isShuttingDown;
  }

  /**
   * Force immediate shutdown of the worker pool
   */
  public async terminate(): Promise<void> {
    this.clearIdleTimer();
    await this.shutdownPool();
  }
}

/**
 * Create a managed replay indexing pool with lazy initialization and idle timeout
 */
export function createManagedReplayIndexingPool(): ReplayIndexingPoolManager {
  return new ReplayIndexingPoolManager();
}
