// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow

// import * as fs from "fs-extra";
// import * as path from "path";
import { SlippiGame } from "@slippi/slippi-js";
import { ModuleMethods } from "threads/dist/types/master";
// import { Observable, Subject } from "threads/observable";
import { expose } from "threads/worker";

// const gitLock: any = {};

function fibonacci(n: number): number {
  if (n < 2) {
    return 1;
  } else {
    return fibonacci(n - 2) + fibonacci(n - 1);
  }
}

export interface Methods {
  destroyWorker: () => Promise<void>;
  // start: (rootFolder: string) => Promise<void>;
  fib: (n: number) => Promise<number>;
  processSlpFile: (filename: string) => Promise<any>;
}

export type WorkerSpec = ModuleMethods & Methods;

/* Returns true if given path does not exist. */
// async function pathIsTaken(path: string): Promise<boolean> {
//   let taken: boolean;
//   try {
//     await fs.stat(path);
//     taken = true;
//   } catch (e) {
//     await fs.ensureDir(path);
//     taken = false;
//   }
//   return taken;
// }

const methods: WorkerSpec = {
  async destroyWorker() {
    // for (const { statusSubject } of Object.values(repositoryStatus)) {
    //   statusSubject.complete();
    // }
  },

  async fib(n) {
    return fibonacci(n);
  },

  async processSlpFile(filename) {
    const game = new SlippiGame(filename);
    const frame = game.getLatestFrame();
    return frame;
  },
};

expose(methods);
