// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

import { DolphinLaunchType } from "@dolphin/types";
import { isLinux } from "common/constants";
import find from "find-process";
import { ModuleMethods } from "threads/dist/types/master";
import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

export interface Methods {
  destroyWorker: () => Promise<void>;
  getLogObservable(): Observable<string>;
  getErrorObservable(): Observable<Error | string>;
  getProcessStatusObservable(): Observable<{ isRunning: boolean; dolphinType: DolphinLaunchType }>;
}

export type WorkerSpec = ModuleMethods & Methods;

const dolphinProcessId = {
  netplay: 0,
  playback: 0,
};

const processMonitor = async () => {
  const binaryName = isLinux ? "Slippi_Online" : "Slippi Dolphin";
  if (dolphinProcessId.netplay) {
    const process = await find("pid", dolphinProcessId.netplay);
    if (process.length === 0) {
      dolphinProcessId.netplay = 0;
      processStatusSubject.next({ isRunning: false, dolphinType: DolphinLaunchType.NETPLAY });
    }
  }
  if (dolphinProcessId.playback) {
    const process = await find("pid", dolphinProcessId.playback);
    if (process.length === 0) {
      dolphinProcessId.netplay = 0;
      processStatusSubject.next({ isRunning: false, dolphinType: DolphinLaunchType.PLAYBACK });
    }
  }

  if (!dolphinProcessId.netplay || !dolphinProcessId.playback) {
    const processes = await find("name", binaryName);
    processes.forEach(async (process) => {
      // break early if the parent is the launcher cause then we have control of the process already.
      // on linux the Launcher doesn't seem to be the parent so skip this.
      // we will end up  double counting because of that but it is probably fine.
      if (!isLinux && process.ppid !== undefined) {
        const parentProcess = await find("pid", process.ppid);
        if (
          parentProcess &&
          (parentProcess[0].name.includes("Slippi Launcher") || parentProcess[0].name.includes("electron"))
        ) {
          return;
        }
      }

      if (process.cmd.includes("Slippi Launcher")) {
        if (!dolphinProcessId.playback && process.cmd.includes("playback")) {
          dolphinProcessId.playback = process.pid;
          processStatusSubject.next({ isRunning: true, dolphinType: DolphinLaunchType.PLAYBACK });
        } else if (!dolphinProcessId.netplay && process.cmd.includes("netplay")) {
          dolphinProcessId.netplay = process.pid;
          processStatusSubject.next({ isRunning: true, dolphinType: DolphinLaunchType.NETPLAY });
        }
      }
    });
  }
};

const logSubject = new Subject<string>();
const errorSubject = new Subject<Error | string>();
const processStatusSubject = new Subject<{ isRunning: boolean; dolphinType: DolphinLaunchType }>();

const timer = setInterval(processMonitor, 10000);

const methods: WorkerSpec = {
  async destroyWorker(): Promise<void> {
    // Clean up worker
    if (timer) {
      clearInterval(timer);
    }
  },
  getLogObservable(): Observable<string> {
    return Observable.from(logSubject);
  },
  getErrorObservable(): Observable<Error | string> {
    return Observable.from(errorSubject);
  },
  getProcessStatusObservable(): Observable<{ isRunning: boolean; dolphinType: DolphinLaunchType }> {
    return Observable.from(processStatusSubject);
  },
};

expose(methods);
