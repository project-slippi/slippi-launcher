// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import * as fs from "fs-extra";
import path from "path";

import { SlippiGame, StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { loadFile, loadFiles } from "./loadFile";
import { loadFolder } from "./loadFolder";
import { FolderLoadResult, FileResult, FileHeader, Progress, FileLoadComplete, FileLoadError } from "./types";

export interface Methods {
  destroyWorker: () => Promise<void>;
  loadSingleFile(filePath: string): Promise<FileResult>;
  loadReplayFolder(folder: string): Promise<FolderLoadResult>;
  loadReplayFiles(fileHeaders: FileHeader[], batcherId: number): Promise<void>;
  calculateGameStats(fullPath: string): Promise<StatsType | null>;
  getProgressObservable(): Observable<Progress>;
  getFileLoadCompleteObservable(): Observable<FileLoadComplete>;
  getFileLoadErrorObservable(): Observable<FileLoadError>;
}

export type WorkerSpec = ModuleMethods & Methods;

let progressSubject: Subject<Progress> = new Subject();
const fileLoadSubject: Subject<FileLoadComplete> = new Subject();
const fileErrorSubject: Subject<FileLoadError> = new Subject();

let latestBatcherId = 0;

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },

  getProgressObservable(): Observable<Progress> {
    return Observable.from(progressSubject);
  },

  getFileLoadCompleteObservable(): Observable<FileLoadComplete> {
    return Observable.from(fileLoadSubject);
  },

  getFileLoadErrorObservable(): Observable<FileLoadError> {
    return Observable.from(fileErrorSubject);
  },

  async loadSingleFile(filePath: string): Promise<FileResult> {
    const header = {
      name: path.basename(filePath),
      fullPath: filePath,
      birthtimeMs: (await fs.stat(filePath)).birthtimeMs,
    };
    return {
      header: header,
      details: loadFile(header),
    };
  },

  async loadReplayFolder(folder: string): Promise<FolderLoadResult> {
    const result = await loadFolder(folder, (current, total) => {
      progressSubject.next({ current, total });
    });

    // Reset the progress subject
    progressSubject.complete();
    progressSubject = new Subject();

    return result;
  },

  async loadReplayFiles(fileHeaders: FileHeader[], batcherId: number): Promise<void> {
    latestBatcherId = batcherId;
    await loadFiles(
      fileHeaders,
      batcherId,
      (fileLoadComplete: FileLoadComplete) => {
        fileLoadSubject.next(fileLoadComplete);
      },
      (fileLoadError: FileLoadError) => {
        fileErrorSubject.next(fileLoadError);
      },
      () => {
        return batcherId != latestBatcherId;
      },
    );
    // Do NOT reset the subjects, if the directory changes while one
    // loadReplayFiles is still running, this will stop the new
    // loadReplayFiles request from being able to report results.
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
};

expose(methods);
