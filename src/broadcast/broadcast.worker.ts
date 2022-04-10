// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import type { ConnectionStatus } from "@slippi/slippi-js";
import type { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { BroadcastManager } from "./broadcastManager";
import type { StartBroadcastConfig } from "./types";
import { BroadcastEvent } from "./types";

interface Methods {
  dispose: () => Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<Error | string>;
  getSlippiStatusObservable(): Observable<{ status: ConnectionStatus }>;
  getDolphinStatusObservable(): Observable<{ status: ConnectionStatus }>;
  getReconnectObservable(): Observable<{ config: StartBroadcastConfig }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const broadcastManager = new BroadcastManager();

const logSubject = new Subject<string>();
const errorSubject = new Subject<Error | string>();
const slippiStatusSubject = new Subject<{ status: ConnectionStatus }>();
const dolphinStatusSubject = new Subject<{ status: ConnectionStatus }>();
const reconnectSubject = new Subject<{ config: StartBroadcastConfig }>();

broadcastManager.on(BroadcastEvent.LOG, (msg: string) => {
  logSubject.next(msg);
});
broadcastManager.on(BroadcastEvent.ERROR, (err: Error | string) => {
  errorSubject.next(err);
});
broadcastManager.on(BroadcastEvent.SLIPPI_STATUS_CHANGE, (status: ConnectionStatus) => {
  slippiStatusSubject.next({ status });
});
broadcastManager.on(BroadcastEvent.DOLPHIN_STATUS_CHANGE, (status: ConnectionStatus) => {
  dolphinStatusSubject.next({ status });
});
broadcastManager.on(BroadcastEvent.RECONNECT, (config: StartBroadcastConfig) => {
  reconnectSubject.next({ config });
});

const methods: WorkerSpec = {
  async dispose(): Promise<void> {
    // Clean up worker
    logSubject.complete();
    errorSubject.complete();
    slippiStatusSubject.complete();
    dolphinStatusSubject.complete();
    reconnectSubject.complete();

    broadcastManager.removeAllListeners();
  },
  async startBroadcast(config: StartBroadcastConfig): Promise<void> {
    await broadcastManager.start(config);
  },
  async stopBroadcast(): Promise<void> {
    broadcastManager.stop();
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<Error | string> {
    return Observable.from(errorSubject);
  },
  getSlippiStatusObservable(): Observable<{ status: ConnectionStatus }> {
    return Observable.from(slippiStatusSubject);
  },
  getDolphinStatusObservable(): Observable<{ status: ConnectionStatus }> {
    return Observable.from(dolphinStatusSubject);
  },
  getReconnectObservable(): Observable<{ config: StartBroadcastConfig }> {
    return Observable.from(reconnectSubject);
  },
};

expose(methods);
