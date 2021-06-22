import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { randomBytes } from "crypto";
import { app } from "electron";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import path from "path";

import { fileExists } from "../main/fileExists";
import { ReplayCommunication } from "./types";

const generateTempCommunicationFile = (): string => {
  const tmpDir = app.getPath("temp");
  const uniqueId = randomBytes(12).toString("hex");
  const commFileName = `slippi-comms-${uniqueId}.json`;
  const commFileFullPath = path.join(tmpDir, commFileName);
  return commFileFullPath;
};

export class DolphinInstance extends EventEmitter {
  protected process: ChildProcessWithoutNullStreams | null = null;
  private executablePath: string;
  private isoPath: string | null = null;

  public constructor(execPath: string, isoPath?: string) {
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

    this.process = spawn(this.executablePath, params);
    this.process.on("close", () => {
      this.emit("close");
    });
    this.process.on("error", (err) => {
      this.emit("error", err);
    });
  }
}

export class PlaybackDolphinInstance extends DolphinInstance {
  private commPath: string;

  public constructor(execPath: string, isoPath?: string) {
    super(execPath, isoPath);
    this.commPath = generateTempCommunicationFile();

    // Delete the comm file once Dolphin is closed
    this.on("close", () => {
      fileExists(this.commPath).then((exists) => {
        if (exists) {
          fs.unlink(this.commPath);
        }
      });
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
