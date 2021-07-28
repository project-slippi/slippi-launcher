// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import { ConnectionStatus } from "@slippi/slippi-js";
import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

import { BroadcastManager } from "./broadcastManager";
import { BroadcastEvent, StartBroadcastConfig } from "./types";

export interface Methods {
  destroyWorker: () => Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<string>;
  getSlippiStatusObservable(): Observable<{ status: ConnectionStatus }>;
  getDolphinStatusObservable(): Observable<{ status: ConnectionStatus }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const broadcastManager = new BroadcastManager();

const logSubject = new Subject<string>();
const errorSubject = new Subject<string>();
const slippiStatusSubject = new Subject<{ status: ConnectionStatus }>();
const dolphinStatusSubject = new Subject<{ status: ConnectionStatus }>();

broadcastManager.on(BroadcastEvent.LOG, (msg: string) => {
  logSubject.next(msg);
});
broadcastManager.on(BroadcastEvent.ERROR, (errorMsg: string) => {
  errorSubject.next(errorMsg);
});
broadcastManager.on(BroadcastEvent.SLIPPI_STATUS_CHANGE, (status: ConnectionStatus) => {
  slippiStatusSubject.next({ status });
});
broadcastManager.on(BroadcastEvent.DOLPHIN_STATUS_CHANGE, (status: ConnectionStatus) => {
  dolphinStatusSubject.next({ status });
});

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
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
  getErrorObservable(): Observable<string> {
    return Observable.from(errorSubject);
  },
  getSlippiStatusObservable(): Observable<{ status: ConnectionStatus }> {
    return Observable.from(slippiStatusSubject);
  },
  getDolphinStatusObservable(): Observable<{ status: ConnectionStatus }> {
    return Observable.from(dolphinStatusSubject);
  },
};

expose(methods);
