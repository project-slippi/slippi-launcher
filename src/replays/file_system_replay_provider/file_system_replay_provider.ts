import type { FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";

import type { ReplayWorker } from "./replays.worker.interface";
import { createReplayWorker } from "./replays.worker.interface";

export class FileSystemReplayProvider implements ReplayProvider {
  private replayBrowserWorker: Promise<ReplayWorker>;

  constructor() {
    this.replayBrowserWorker = createReplayWorker();
  }

  public async init(): Promise<void> {
    // Do nothing
  }

  public async loadFile(filePath: string): Promise<FileResult> {
    const worker = await this.replayBrowserWorker;
    return worker.loadSingleFile(filePath);
  }

  public async loadFolder(folderPath: string, onProgress?: (progress: Progress) => void) {
    const worker = await this.replayBrowserWorker;
    worker.getProgressObservable().subscribe((progress) => {
      onProgress?.(progress);
    });
    return worker.loadReplayFolder(folderPath);
  }

  public async calculateGameStats(filePath: string): Promise<StatsType | null> {
    const worker = await this.replayBrowserWorker;
    return worker.calculateGameStats(filePath);
  }

  public async calculateStadiumStats(filePath: string): Promise<StadiumStatsType | null> {
    const worker = await this.replayBrowserWorker;
    return worker.calculateStadiumStats(filePath);
  }
}
