// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { SpectateManager } from "./spectateManager";
import { BroadcasterItem, SpectateEvent } from "./types";

export interface Methods {
  destroyWorker: () => Promise<void>;
  startSpectate(broadcastId: string, targetPath: string): Promise<void>;
  stopSpectate(broadcastId: string): Promise<void>;
  dolphinClosed(playbackId: string): Promise<void>;
  refreshBroadcastList(authToken: string): Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<string>;
  getBroadcastListObservable(): Observable<BroadcasterItem[]>;
  getSpectateDetailsObservable(): Observable<{ playbackId: string; filePath: string }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const spectateManager = new SpectateManager();

const logSubject = new Subject<string>();
const errorSubject = new Subject<string>();
const broadcastListSubject = new Subject<BroadcasterItem[]>();
const spectateDetailsSubject = new Subject<{ playbackId: string; filePath: string }>();

// Forward the events to the renderer
spectateManager.on(SpectateEvent.BROADCAST_LIST_UPDATE, async (data: BroadcasterItem[]) => {
  broadcastListSubject.next(data);
});

spectateManager.on(SpectateEvent.LOG, async (msg: string) => {
  logSubject.next(msg);
});

spectateManager.on(SpectateEvent.ERROR, async (errorMsg: string) => {
  errorSubject.next(errorMsg);
});

spectateManager.on(SpectateEvent.NEW_FILE, async (playbackId: string, filePath: string) => {
  spectateDetailsSubject.next({ playbackId, filePath });
});

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
  },
  async startSpectate(broadcastId: string, targetPath: string): Promise<void> {
    await spectateManager.watchBroadcast(broadcastId, targetPath);
  },
  async stopSpectate(broadcastId: string): Promise<void> {
    spectateManager.stopWatchingBroadcast(broadcastId);
  },
  async dolphinClosed(playbackId: string): Promise<void> {
    spectateManager.handleClosedDolphin(playbackId);
  },
  async refreshBroadcastList(authToken: string): Promise<void> {
    await spectateManager.connect(authToken);
    await spectateManager.refreshBroadcastList();
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<string> {
    return Observable.from(errorSubject);
  },
  getBroadcastListObservable(): Observable<BroadcasterItem[]> {
    return Observable.from(broadcastListSubject);
  },
  getSpectateDetailsObservable(): Observable<{ playbackId: string; filePath: string }> {
    return Observable.from(spectateDetailsSubject);
  },
};

expose(methods);
