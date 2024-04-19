// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import type { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { SpectateManager } from "./spectate_manager";
import type { BroadcasterItem, SpectateDolphinOptions } from "./types";
import { SpectateEvent } from "./types";

interface Methods {
  dispose: () => Promise<void>;
  startSpectate(broadcastId: string, targetPath: string, dolphinOptions: SpectateDolphinOptions): Promise<string>;
  stopSpectate(broadcastId: string): Promise<void>;
  dolphinClosed(playbackId: string): Promise<void>;
  connect(authToken: string): Promise<void>;
  refreshBroadcastList(): Promise<void>;
  getOpenBroadcasts(): Promise<{ broadcastId: string; dolphinId: string }[]>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<Error | string>;
  getBroadcastListObservable(): Observable<BroadcasterItem[]>;
  getSpectateDetailsObservable(): Observable<{ playbackId: string; filePath: string; broadcasterName: string }>;
  getReconnectObservable(): Observable<Record<never, never>>;
  getGameEndObservable(): Observable<string>;
}

export type WorkerSpec = ModuleMethods & Methods;

const spectateManager = new SpectateManager();

const logSubject = new Subject<string>();
const errorSubject = new Subject<Error | string>();
const broadcastListSubject = new Subject<BroadcasterItem[]>();
const spectateDetailsSubject = new Subject<{ playbackId: string; filePath: string; broadcasterName: string }>();
const reconnectSubject = new Subject<Record<never, never>>();
const gameEndSubject = new Subject<string>();

// Forward the events to the renderer
spectateManager.on(SpectateEvent.BROADCAST_LIST_UPDATE, async (data: BroadcasterItem[]) => {
  broadcastListSubject.next(data);
});

spectateManager.on(SpectateEvent.LOG, async (msg: string) => {
  logSubject.next(msg);
});

spectateManager.on(SpectateEvent.ERROR, async (err: Error | string) => {
  errorSubject.next(err);
});

spectateManager.on(SpectateEvent.NEW_FILE, async (playbackId: string, filePath: string, broadcasterName: string) => {
  spectateDetailsSubject.next({ playbackId, filePath, broadcasterName });
});

spectateManager.on(SpectateEvent.RECONNECT, async () => {
  reconnectSubject.next({});
});

spectateManager.on(SpectateEvent.GAME_END, async (dolphinId: string) => {
  gameEndSubject.next(dolphinId);
});

const methods: WorkerSpec = {
  async dispose(): Promise<void> {
    // Clean up worker
    logSubject.complete();
    errorSubject.complete();
    broadcastListSubject.complete();
    spectateDetailsSubject.complete();
    reconnectSubject.complete();

    spectateManager.removeAllListeners();
  },
  async startSpectate(
    broadcastId: string,
    targetPath: string,
    dolphinOptions: SpectateDolphinOptions,
  ): Promise<string> {
    return await spectateManager.watchBroadcast(broadcastId, targetPath, dolphinOptions);
  },
  async stopSpectate(broadcastId: string): Promise<void> {
    spectateManager.stopWatchingBroadcast(broadcastId);
  },
  async dolphinClosed(playbackId: string): Promise<void> {
    spectateManager.handleClosedDolphin(playbackId);
  },
  async connect(authToken: string): Promise<void> {
    await spectateManager.connect(authToken);
  },
  async refreshBroadcastList(): Promise<void> {
    await spectateManager.refreshBroadcastList();
  },
  async getOpenBroadcasts() {
    return await spectateManager.getOpenBroadcasts();
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<Error | string> {
    return Observable.from(errorSubject);
  },
  getBroadcastListObservable(): Observable<BroadcasterItem[]> {
    return Observable.from(broadcastListSubject);
  },
  getSpectateDetailsObservable(): Observable<{ playbackId: string; filePath: string; broadcasterName: string }> {
    return Observable.from(spectateDetailsSubject);
  },
  getReconnectObservable(): Observable<Record<never, never>> {
    return Observable.from(reconnectSubject);
  },
  getGameEndObservable(): Observable<string> {
    return Observable.from(gameEndSubject);
  },
};

expose(methods);
