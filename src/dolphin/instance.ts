import type { ChildProcess } from "child_process";
import { execFile, spawn } from "child_process";
import { randomBytes } from "crypto";
import { app } from "electron";
import electronLog from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import path from "path";
import { fileExists } from "utils/fileExists";

import type { ReplayCommunication } from "./types";

const log = electronLog.scope("dolphin/instance");
const isMac = process.platform === "darwin";

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
  public start(additionalParams?: string[]) {
    const params: string[] = [];

    // Auto-start the ISO if provided
    if (this.isoPath) {
      params.push("-b", "-e", this.isoPath);
    }

    // Add additional params if necessary
    if (additionalParams && additionalParams.length > 0) {
      params.push(...additionalParams);
    }

    // On macOS, the default process.spawn seems to have odd overhead and causes deadlocks in Dolphin's rendering
    // process - as best I can tell, it's not separating the event loops and just choking immediately.
    //
    // If you read the Node.js source, execFile basically goes through `.spawn` as well, but sets a few
    // different options along the way. Notably, there's a number of option flags that aren't available on the
    // SpawnOptions TypeScript hint, for whatever reason... so trying to pass them here blows up.
    //
    // tl;dr: for macOS, pass through execFile and set a massively high buffer for performance reasons. The returned
    // child process is ultimately the same, or close enough for now, and keeps the rest of the codebase intact.
    if (isMac) {
      this.process = execFile(this.executablePath, params, {
        // 100MB
        maxBuffer: 1000 * 1000 * 100,
      });
    } else {
      this.process = spawn(this.executablePath, params);
    }

    this.process.on("close", (code) => {
      this.emit("close", code);
    });
    this.process.on("error", (err) => {
      this.emit("error", err);
    });
  }
}

export class PlaybackDolphinInstance extends DolphinInstance {
  private commPath: string;

  constructor(execPath: string, isoPath?: string) {
    super(execPath, isoPath);
    this.commPath = generateTempCommunicationFile();

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

  /***
   * Starts Dolphin with the specified replay communication options
   */
  public async play(options: ReplayCommunication) {
    // Automatically generate a command id if not provided
    if (!options.commandId) {
      options.commandId = Math.random().toString(36).slice(2);
    }

    // Write out the comms file
    await fs.writeFile(this.commPath, JSON.stringify(options));

    if (!this.process) {
      const params: string[] = [];
      // Launch this comms file
      params.push("-i", this.commPath);

      this.start(params);
    }
  }
}
