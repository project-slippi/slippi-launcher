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
  getErrorObservable(): Observable<string>;
  getSlippiStatusObservable(): Observable<ConnectionStatus>;
  getDolphinStatusObservable(): Observable<ConnectionStatus>;
}

export type WorkerSpec = ModuleMethods & Methods;

const broadcastManager = new BroadcastManager();

const errorSubject = new Subject<string>();
const slippiStatusSubject = new Subject<ConnectionStatus>();
const dolphinStatusSubject = new Subject<ConnectionStatus>();

broadcastManager.on(BroadcastEvent.error, (errorMsg: string) => {
  errorSubject.next(errorMsg);
});
broadcastManager.on(BroadcastEvent.slippiStatusChange, (status) => {
  slippiStatusSubject.next(status);
});
broadcastManager.on(BroadcastEvent.dolphinStatusChange, (status) => {
  dolphinStatusSubject.next(status);
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
  getErrorObservable(): Observable<string> {
    return Observable.from(errorSubject);
  },
  getSlippiStatusObservable(): Observable<ConnectionStatus> {
    return Observable.from(slippiStatusSubject);
  },
  getDolphinStatusObservable(): Observable<ConnectionStatus> {
    return Observable.from(dolphinStatusSubject);
  },
};

expose(methods);
