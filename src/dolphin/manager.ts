import { settingsManager } from "@settings/settingsManager";
import log from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import { fileExists } from "main/fileExists";
import path from "path";

import { downloadAndInstallDolphin } from "./downloadDolphin";
import { DolphinInstance, PlaybackDolphinInstance } from "./instance";
import { DolphinLaunchType, ReplayCommunication } from "./types";
import { findDolphinExecutable, findUserFolder } from "./util";

// DolphinManager should be in control of all dolphin instances that get opened for actual use.
// This includes playing netplay, viewing replays, watching broadcasts (spectating), and configuring Dolphin.
export class DolphinManager extends EventEmitter {
  private playbackDolphinInstances = new Map<string, PlaybackDolphinInstance>();
  private netplayDolphinInstance: DolphinInstance | null = null;

  public async launchPlaybackDolphin(id: string, replayComm: ReplayCommunication): Promise<void> {
    const dolphinPath = await findDolphinExecutable(DolphinLaunchType.PLAYBACK);
    const meleeIsoPath = await this._getIsoPath();

    const configuring = this.playbackDolphinInstances.get("configure");
    if (configuring) {
      throw new Error("Cannot open dolphin if a configuring dolphin is open.");
    }
    let playbackInstance = this.playbackDolphinInstances.get(id);
    if (!playbackInstance) {
      playbackInstance = new PlaybackDolphinInstance(dolphinPath, meleeIsoPath);
      playbackInstance.on("close", () => {
        this.emit("dolphin-closed", id);

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete(id);
      });
      this.playbackDolphinInstances.set(id, playbackInstance);
    }

    await playbackInstance.play(replayComm);
  }

  public async launchNetplayDolphin() {
    if (this.netplayDolphinInstance) {
      throw new Error("Netplay dolphin is already open!");
    }

    const dolphinPath = await findDolphinExecutable(DolphinLaunchType.NETPLAY);
    log.info(`Launching dolphin at path: ${dolphinPath}`);
    const meleeIsoPath = await this._getIsoPath();

    // Create the Dolphin instance and start it
    this.netplayDolphinInstance = new DolphinInstance(dolphinPath, meleeIsoPath);
    this.netplayDolphinInstance.on("close", () => {
      this.netplayDolphinInstance = null;
    });
    this.netplayDolphinInstance.start();
  }

  public async configureDolphin(launchType: DolphinLaunchType) {
    log.debug(`configuring ${launchType} dolphin...`);
    const dolphinPath = await findDolphinExecutable(launchType);
    if (launchType === DolphinLaunchType.NETPLAY && !this.netplayDolphinInstance) {
      const instance = new DolphinInstance(dolphinPath);
      this.netplayDolphinInstance = instance;
      instance.on("close", () => {
        this.netplayDolphinInstance = null;
      });
      instance.on("error", (err: Error) => {
        this.netplayDolphinInstance = null;

        log.error(err);
        throw err;
      });
      instance.start();
    } else if (launchType === DolphinLaunchType.PLAYBACK && this.playbackDolphinInstances.size === 0) {
      const instance = new PlaybackDolphinInstance(dolphinPath);
      this.playbackDolphinInstances.set("configure", instance);
      instance.on("close", () => {
        this.emit("dolphin-closed", "configure");

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete("configure");
      });
      instance.on("error", (err: Error) => {
        this.emit("dolphin-closed", "configure");

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete("configure");

        log.error(err);
        throw err;
      });
      instance.start();
    }
  }

  public async reinstallDolphin(launchType: DolphinLaunchType) {
    switch (launchType) {
      case DolphinLaunchType.NETPLAY: {
        if (this.netplayDolphinInstance !== null) {
          log.warn("A netplay dolphin is open");
          return;
        }
        break;
      }
      case DolphinLaunchType.PLAYBACK: {
        if (this.playbackDolphinInstances.size > 0) {
          log.warn("A playback dolphin is open");
          return;
        }
        break;
      }
    }

    // No dolphins of launchType are open so lets reinstall
    await downloadAndInstallDolphin(launchType, log.info, true);
  }

  public async clearCache(launchType: DolphinLaunchType) {
    const userFolder = await findUserFolder(launchType);
    const cacheFolder = path.join(userFolder, "Cache");
    try {
      await fs.remove(cacheFolder);
    } catch (err) {
      log.error(err);
      throw err;
    }
  }

  private async _getIsoPath(): Promise<string | undefined> {
    const meleeIsoPath = settingsManager.get().settings.isoPath ?? undefined;
    if (meleeIsoPath) {
      // Make sure the file actually exists
      if (!(await fileExists(meleeIsoPath))) {
        throw new Error(`Could not find ISO file: ${meleeIsoPath}`);
      }
    }
    return meleeIsoPath;
  }
}

export const dolphinManager = new DolphinManager();
