// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import { SlippiGame, StatsType } from "@slippi/slippi-js";
import { FileLoadResult } from "common/types";
import _ from "lodash";
import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { loadFolder } from "./loadFolder";

export interface Methods {
  destroyWorker: () => Promise<void>;
  loadReplayFolder(folder: string): Promise<FileLoadResult>;
  calculateGameStats(fullPath: string): Promise<StatsType>;
  getProgressObservable(): Observable<Progress>;
}

export type WorkerSpec = ModuleMethods & Methods;

interface Progress {
  current: number;
  total: number;
}

let progressSubject: Subject<Progress> = new Subject();

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },
  getProgressObservable(): Observable<Progress> {
    return Observable.from(progressSubject);
  },
  async loadReplayFolder(folder: string): Promise<FileLoadResult> {
    const result = await loadFolder(folder, (current, total) => {
      progressSubject.next({ current, total });
    });

    // Reset the progress subject
    progressSubject.complete();
    progressSubject = new Subject();

    return result;
  },
  async calculateGameStats(fullPath: string): Promise<StatsType> {
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
};

expose(methods);
