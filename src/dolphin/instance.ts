import type { ChildProcess } from "child_process";
import { execFile, spawn } from "child_process";
import { delay } from "common/delay";
import { randomBytes } from "crypto";
import { app } from "electron";
import electronLog from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import debounce from "lodash/debounce";
import path from "path";
import { fileExists } from "utils/file_exists";

import type { ReplayCommunication } from "./types";

const log = electronLog.scope("dolphin/instance");
const isMac = process.platform === "darwin";

export class MacOsRosettaRequiredError extends Error {
  constructor() {
    super(
      `Rosetta is required to run this executable. Open the Terminal app and run "softwareupdate --install-rosetta" to install Rosetta.`,
    );
  }
}

const generateTempCommunicationFile = (): string => {
  const tmpDir = path.join(app.getPath("userData"), "temp");
  fs.ensureDirSync(tmpDir);
  const uniqueId = randomBytes(12).toString("hex");
  const commFileName = `slippi-comms-${uniqueId}.json`;
  const commFileFullPath = path.join(tmpDir, commFileName);
  return commFileFullPath;
};

export class DolphinInstance extends EventEmitter {
  protected process: ChildProcess | null = null;
  private executablePath: string;
  private isoPath: string | null = null;

  constructor(execPath: string, isoPath?: string) {
    super();
    this.isoPath = isoPath ?? null;
    this.executablePath = execPath;
  }

  /***
   * Spawns the Dolphin instance with any additional command line parameters
   */
  public async start(additionalParams?: string[]): Promise<void> {
    const params: string[] = [];

    // Auto-start the ISO if provided
    if (this.isoPath) {
      params.push("-b", "-e", this.isoPath);
    }

    // Add additional params if necessary
    if (additionalParams && additionalParams.length > 0) {
      params.push(...additionalParams);
    }

    this.process = await this.startProcess(this.executablePath, params);

    this.process.on("close", (code) => {
      this.emit("close", code);
    });
    this.process.on("error", (err) => {
      this.emit("error", err);
    });

    let combinedString = "";

    const debouncedErrorLog = debounce((msg: string) => {
      combinedString = "";
      log.error(`Received Dolphin stderr message: ${msg}`);
    }, 500);

    this.process.stderr?.on("data", (data) => {
      combinedString += data.toString();
      debouncedErrorLog(combinedString);
    });
  }

  private async startProcess(executablePath: string, params: string[]): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      let started = false;
      let child: ChildProcess;
      // On macOS, the default process.spawn seems to have odd overhead and causes deadlocks in Dolphin's rendering
      // process - as best I can tell, it's not separating the event loops and just choking immediately.
      //
      // If you read the Node.js source, execFile basically goes through `.spawn` as well, but sets a few
      // different options along the way. Notably, there's a number of option flags that aren't available on the
      // SpawnOptions TypeScript hint, for whatever reason... so trying to pass them here blows up.
      //
      // tl;dr: for macOS, pass through execFile and set a massively high buffer for performance reasons. The returned
      // child process is ultimately the same, or close enough for now, and keeps the rest of the codebase intact.
      try {
        if (isMac) {
          child = execFile(executablePath, params, {
            // 100MB
            maxBuffer: 1000 * 1000 * 100,
          });
        } else {
          child = spawn(executablePath, params);
        }

        child.once("spawn", () => {
          started = true;
          resolve(child);
        });

        child.once("error", (err: NodeJS.ErrnoException) => {
          // Process already started successfully, ignore error
          if (!started) {
            reject(err);
          }
        });
      } catch (err: unknown) {
        if (isMac && process.arch === "arm64" && (err as NodeJS.ErrnoException).errno === -86) {
          // EBADARCH – bad CPU type in executable
          reject(new MacOsRosettaRequiredError());
          return;
        }
        reject(err);
      }
    });
  }
}

export class PlaybackDolphinInstance extends DolphinInstance {
  private commPath: string;
  private lastWriteMs: number;

  constructor(execPath: string, isoPath?: string) {
    super(execPath, isoPath);
    this.commPath = generateTempCommunicationFile();
    this.lastWriteMs = 0;

    // Delete the comm file once Dolphin is closed
    this.on("close", async () => {
      try {
        const exists = await fileExists(this.commPath);
        if (exists) {
          await fs.unlink(this.commPath);
        }
      } catch (err) {
        log.warn(err);
      }
    });
  }

  private async writeCommsFile(options: ReplayCommunication) {
    // Playback Slippi Dolphin can't pick up comms file changes within the same second, so
    // defer writing comms file if it's been less than 1 second since last write.
    //
    // However this will only work if only one invocation comes 'early'.
    // If 2 or more invocations happen within a second after the last,
    // they will all be deferred to approximately the same time.
    // I don't think it's deterministic which one will go first (and therefore succeed).
    const diff = Date.now() - this.lastWriteMs;
    if (diff < 1000) {
      await delay(1000 - diff);
    }
    await fs.writeFile(this.commPath, JSON.stringify(options));
    this.lastWriteMs = Date.now();
  }

  /***
   * Starts Dolphin with the specified replay communication options
   */
  public async play(options: ReplayCommunication) {
    // Automatically generate a command id if not provided
    if (!options.commandId) {
      options.commandId = Math.random().toString(36).slice(2);
    }

    await this.writeCommsFile(options);

    if (!this.process) {
      const params: string[] = [];
      // Launch this comms file
      params.push("-i", this.commPath);

      await this.start(params);
    }
  }
}
