// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import type { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { MirrorManager } from "./mirrorManager";
import type { ConsoleMirrorStatusUpdate, MirrorConfig } from "./types";
import { MirrorEvent } from "./types";

interface Methods {
  dispose: () => Promise<void>;
  connectToConsole(config: MirrorConfig): Promise<void>;
  disconnectFromConsole(ip: string): Promise<void>;
  startMirroring(id: string): Promise<void>;
  dolphinClosed(playbackId: string): Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<Error | string>;
  getMirrorDetailsObservable(): Observable<{ playbackId: string; filePath: string; isRealtime: boolean }>;
  getMirrorStatusObservable(): Observable<{ ip: string; info: Partial<ConsoleMirrorStatusUpdate> }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const mirrorManager = new MirrorManager();

const logSubject = new Subject<string>();
const errorSubject = new Subject<Error | string>();
const mirrorDetailsSubject = new Subject<{ playbackId: string; filePath: string; isRealtime: boolean }>();
const mirrorStatusSubject = new Subject<{ ip: string; info: Partial<ConsoleMirrorStatusUpdate> }>();

// Forward the events to the renderer
mirrorManager.on(MirrorEvent.LOG, async (msg: string) => {
  logSubject.next(msg);
});

mirrorManager.on(MirrorEvent.ERROR, async (error: Error | string) => {
  errorSubject.next(error);
});

mirrorManager.on(MirrorEvent.NEW_FILE, async (playbackId: string, filePath: string, isRealtime: boolean) => {
  mirrorDetailsSubject.next({ playbackId, filePath, isRealtime });
});

mirrorManager.on(
  MirrorEvent.MIRROR_STATUS_CHANGE,
  async (statusUpdate: { ip: string; info: Partial<ConsoleMirrorStatusUpdate> }) => {
    mirrorStatusSubject.next(statusUpdate);
  },
);

const methods: WorkerSpec = {
  async dispose(): Promise<void> {
    // Clean up worker
    logSubject.complete();
    errorSubject.complete();
    mirrorDetailsSubject.complete();
    mirrorStatusSubject.complete();

    mirrorManager.removeAllListeners();
  },
  async connectToConsole(config: MirrorConfig): Promise<void> {
    await mirrorManager.connect(config);
  },
  async disconnectFromConsole(ip: string): Promise<void> {
    await mirrorManager.disconnect(ip);
  },
  async startMirroring(id: string): Promise<void> {
    await mirrorManager.startMirroring(id);
  },
  async dolphinClosed(playbackId: string): Promise<void> {
    await mirrorManager.handleClosedDolphin(playbackId);
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<Error | string> {
    return Observable.from(errorSubject);
  },
  getMirrorDetailsObservable(): Observable<{ playbackId: string; filePath: string; isRealtime: boolean }> {
    return Observable.from(mirrorDetailsSubject);
  },
  getMirrorStatusObservable(): Observable<{ ip: string; info: Partial<ConsoleMirrorStatusUpdate> }> {
    return Observable.from(mirrorStatusSubject);
  },
};

expose(methods);
