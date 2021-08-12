import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { randomBytes } from "crypto";
import log from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import path from "path";

import { fileExists } from "../main/fileExists";
import { isMac } from "../common/constants";
import { ReplayCommunication } from "./types";
import { generateTempCommsDirectoryPath } from "../main/util";

const generateTempCommunicationFile = (): string => {
  const commsDirectory = generateTempCommsDirectoryPath();
  const uniqueId = randomBytes(12).toString("hex");
  return path.join(commsDirectory, `${uniqueId}.json`);
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
    let executablePath = this.executablePath;
    const params: string[] = [];

    // On macOS, spawning Dolphin as a child process seems to cause deadlocks to occur
    // when rendering the game. This notably happens with (MoltenVK/Vulkan/Metal), but has
    // exhibited itself under OpenGL as well. Modern macOS really needs to run Vulkan, though,
    // so we need to work around the issue here.
    //
    // Ultimately this needs a better solution for the long term, but for now, we'll just route
    // through the `open` command and ferry the args along. This is a little less nice than other
    // platforms, but keeps macOS performant and... working.
    if (isMac) {
      executablePath = "open";

      // Open needs the bundle path, not the executable path.
      params.push(this.executablePath.replace("/Contents/MacOS/Slippi Dolphin", ""), "--args");
    }

    // Auto-start the ISO if provided
    if (this.isoPath) {
      params.push("-b", "-e", this.isoPath);
    }

    // Add additional params if necessary
    if (additionalParams && additionalParams.length > 0) {
      params.push(...additionalParams);
    }

    this.process = spawn(executablePath, params); //, { detached: isMac ? true : false });

    // Since macOS routes through the `open` command, the child process will return immediately.
    // This means that the `close` event triggers immediately, and playback won't work due to the
    // comms file being deleted from underneath it.
    //
    // Thus, attach these on non-macOS platforms, and have macOS clean up temp comms files at
    // app start. Less graceful, but works.
    if (!isMac) {
      this.process.on("close", () => {
        this.emit("close");
      });
      this.process.on("error", (err) => {
        this.emit("error", err);
      });
    }
  }
}

export class PlaybackDolphinInstance extends DolphinInstance {
  private commPath: string;

  public constructor(execPath: string, isoPath?: string) {
    super(execPath, isoPath);
    this.commPath = generateTempCommunicationFile();

    // Delete the comm file once Dolphin is closed
    // See notes elsewhere in this file regarding why this isn't attached
    // for macOS.
    if (!isMac) {
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
  }

  /***
   * Starts Dolphin with the specified replay communication options
   */
  public async play(options: ReplayCommunication) {
    // Automatically generate a command id if not provided
    if (!options.commandId) {
      options.commandId = Math.random().toString(36).slice(2);
    }

    // Write out the comms file.
    // Note that `outputFile` will create an intermediate directory if
    // necessary, which fits the cleanup model for temp comms files.
    await fs.outputFile(this.commPath, JSON.stringify(options));

    if (!this.process) {
      const params: string[] = [];
      // Launch this comms file
      params.push("-i", this.commPath);

      this.start(params);
    }
  }
}
