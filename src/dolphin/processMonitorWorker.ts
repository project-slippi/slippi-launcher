// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import { isLinux } from "common/constants";
import find from "find-process";
import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

export interface Methods {
  destroyWorker: () => Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<Error | string>;
  getProcessStatusObservable(): Observable<{ externalOpened: boolean }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const processMonitor = async () => {
  const binaryName = isLinux ? "Slippi_Online" : "Slippi Dolphin";

  const processes = await find("name", binaryName);
  if (processes.length === 0) {
    processStatusSubject.next({ externalOpened: false });
  }
  processes.forEach(async (process) => {
    // break early if the parent is the launcher cause then we have control of the process already.
    // on linux the Launcher doesn't seem to be the parent so skip this.
    // we will end up  double counting because of that but it is probably fine.
    if (!isLinux && process.ppid !== undefined) {
      const parentProcess = await find("pid", process.ppid);
      if (parentProcess.length > 0) {
        const name = parentProcess[0].name.toLowerCase();
        if (name.includes("slippi launcher") || name.includes("electron")) {
          return;
        }
      }
    }

    processStatusSubject.next({ externalOpened: true });
  });
};

const logSubject = new Subject<string>();
const errorSubject = new Subject<Error | string>();
const processStatusSubject = new Subject<{ externalOpened: boolean }>();

const timer = setInterval(processMonitor, 10000);

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
    clearInterval(timer);
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<Error | string> {
    return Observable.from(errorSubject);
  },
  getProcessStatusObservable(): Observable<{ externalOpened: boolean }> {
    return Observable.from(processStatusSubject);
  },
};

expose(methods);
