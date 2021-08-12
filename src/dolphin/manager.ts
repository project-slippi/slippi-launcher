import { settingsManager } from "@settings/settingsManager";
import log from "electron-log";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import { fileExists } from "main/fileExists";
import path from "path";

import { downloadAndInstallDolphin } from "./downloadDolphin";
import { DolphinInstance, PlaybackDolphinInstance } from "./instance";
import { isMac } from "../common/constants";
import { DolphinLaunchType, ReplayCommunication } from "./types";
import { addGamePathToIni, findDolphinExecutable, findUserFolder } from "./util";

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

      // macOS needs to route through `open` for platform/performance reasons, and `open` will
      // route a user to an existing open (netplay|playback) build already - so just ignore the tracking/
      // maintaining on macOS.
      if (!isMac) {
        playbackInstance.on("close", () => {
          this.emit("dolphin-closed", id);

          // Remove the instance from the map on close
          this.playbackDolphinInstances.delete(id);
        });
        this.playbackDolphinInstances.set(id, playbackInstance);
      }
    }

    await playbackInstance.play(replayComm);
  }

  public async launchNetplayDolphin() {
    if (this.netplayDolphinInstance) {
      throw new Error("Netplay dolphin is already open!");
    }

    const dolphinPath = await findDolphinExecutable(DolphinLaunchType.NETPLAY);
    log.info(`Launching dolphin at path: ${dolphinPath}`);
    const launchMeleeOnPlay = settingsManager.get().settings.launchMeleeOnPlay;
    const meleeIsoPath = launchMeleeOnPlay ? await this._getIsoPath() : undefined;

    // Create the Dolphin instance and start it
    const netplayDolphinInstance = new DolphinInstance(dolphinPath, meleeIsoPath);

    //  On macOS, we don't control the resulting process once it goes through `open`, so
    //  don't bother tracking it. `open` will route a user to the correct already-open instance
    //  if they click the button again anyway.
    if (!isMac) {
      this.netplayDolphinInstance = netplayDolphinInstance;
      this.netplayDolphinInstance.on("close", () => {
        this.netplayDolphinInstance = null;
      });
    }

    netplayDolphinInstance.start();
  }

  // macOS needs to route through `open` for performance reasons (see comments in dolphin/instance.ts).
  // `open` will already route the user back to an existing open Dolphin (netplay|playback), if one is open,
  // so we can ignore the tracking instance logic without too much issue here.
  public async configureDolphin(launchType: DolphinLaunchType) {
    log.debug(`configuring ${launchType} dolphin...`);
    const dolphinPath = await findDolphinExecutable(launchType);
    if (launchType === DolphinLaunchType.NETPLAY && !this.netplayDolphinInstance) {
      const instance = new DolphinInstance(dolphinPath);

      if (!isMac) {
        this.netplayDolphinInstance = instance;
        instance.on("close", () => {
          this.netplayDolphinInstance = null;
        });
        instance.on("error", (err: Error) => {
          this.netplayDolphinInstance = null;

          log.error(err);
          throw err;
        });
      }

      instance.start();
    } else if (launchType === DolphinLaunchType.PLAYBACK && this.playbackDolphinInstances.size === 0) {
      const instance = new PlaybackDolphinInstance(dolphinPath);

      if (!isMac) {
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
      }

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
    const isoPath = settingsManager.get().settings.isoPath;
    if (isoPath) {
      const gameDir = path.dirname(isoPath);
      await addGamePathToIni(launchType, gameDir);
    }
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

  public async copyDolphinConfig(launchType: DolphinLaunchType, fromPath: string) {
    const newUserFolder = await findUserFolder(launchType);
    const oldUserFolder = path.join(fromPath, "User");

    await fs.copy(oldUserFolder, newUserFolder, { overwrite: true });
  }
}

export const dolphinManager = new DolphinManager();
