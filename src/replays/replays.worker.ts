// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import type { StatsType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import _ from "lodash";
import type { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { loadFile } from "./loadFile";
import { loadReplays } from "./loadFolder";
import type { FileLoadResult, FileResult, Progress } from "./types";

interface Methods {
  dispose: () => Promise<void>;
  loadSingleFile(filePath: string): Promise<FileResult>;
  loadReplays(files: string[]): Promise<FileLoadResult>;
  calculateGameStats(fullPath: string): Promise<StatsType | null>;
  getProgressObservable(): Observable<Progress>;
  getGlobalStatsObservable(): Observable<Progress>;
  computeAllStats(filesToLoad: string[], progress: number, totalCount: number): Promise<FileResult[]>;
}

export type WorkerSpec = ModuleMethods & Methods;

let progressSubject: Subject<Progress> = new Subject();
let globalStatsProgressSubject: Subject<Progress> = new Subject();

const methods: WorkerSpec = {
  async dispose(): Promise<void> {
    // Clean up worker
    progressSubject.complete();
  },
  getProgressObservable(): Observable<Progress> {
    return Observable.from(progressSubject);
  },
  getGlobalStatsObservable(): Observable<Progress> {
    return Observable.from(globalStatsProgressSubject);
  },
  async loadSingleFile(filePath: string): Promise<FileResult> {
    const result = await loadFile(filePath);
    return result;
  },
  async loadReplays(files: string[]): Promise<FileLoadResult> {
    const result = await loadReplays(files, (current, total) => {
      progressSubject.next({ current, total });
    });

    // Reset the progress subject
    progressSubject.complete();
    progressSubject = new Subject();
    return result;
  },
  async saveReplayStats(): Promise<boolean> {
    progressSubject.complete();
    progressSubject = new Subject();
    return true;
  },
  async calculateGameStats(fullPath: string): Promise<StatsType | null> {
    // For a valid SLP game, at the very least we should have valid settings
    const game = new SlippiGame(fullPath);
    const settings = game.getSettings();
    if (!settings || _.isEmpty(settings.players)) {
      throw new Error("Game settings could not be properly loaded.");
    }

    if (settings.players.length !== 2) {
      throw new Error("Stats can only be calculated for 1v1s.");
    }

    return game.getStats();
  },
  async computeAllStats(filesToLoad: string[], progress: number, totalCount: number): Promise<FileResult[]> {
    let count = 0;
    const process = async (file: string) => {
      return new Promise<FileResult | null>((resolve) => {
        setImmediate(() => {
          loadFile(file)
            .then((file) => {
              const game = new SlippiGame(file.fullPath);
              const settings = game.getSettings();
              if (!settings || _.isEmpty(settings.players)) {
                throw new Error("Game settings could not be properly loaded.");
              }
              if (settings.players.length !== 2) {
                throw new Error("Stats can only be calculated for 1v1s.");
              }
              file.stats = game.getStats();
              resolve(file);
            })
            .catch(() => resolve(null))
            .finally(() => {
              globalStatsProgressSubject.next({ current: progress + count++, total: totalCount });
            });
        });
      });
    };
    const games = await Promise.all(filesToLoad.map(process));
    if (count == totalCount) {
      globalStatsProgressSubject.complete();
      globalStatsProgressSubject = new Subject();
    }
    return games.filter((g) => g != null) as FileResult[];
  },
};

expose(methods);
