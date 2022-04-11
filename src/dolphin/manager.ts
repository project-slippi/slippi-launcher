import type { SettingsManager } from "@settings/settingsManager";
import electronLog from "electron-log";
import { EventEmitter } from "events";
import path from "path";
import { fileExists } from "utils/fileExists";

import { DolphinInstallation } from "./install/installation";
import { DolphinInstance, PlaybackDolphinInstance } from "./instance";
import type { ReplayCommunication } from "./types";
import { DolphinLaunchType } from "./types";

const log = electronLog.scope("dolphin/manager");

// DolphinManager should be in control of all dolphin instances that get opened for actual use.
// This includes playing netplay, viewing replays, watching broadcasts (spectating), and configuring Dolphin.
export class DolphinManager extends EventEmitter {
  private playbackDolphinInstances = new Map<string, PlaybackDolphinInstance>();
  private netplayDolphinInstance: DolphinInstance | null = null;

  constructor(private settingsManager: SettingsManager) {
    super();
  }

  public getInstallation(launchType: DolphinLaunchType): DolphinInstallation {
    const dolphinPath = this.settingsManager.getDolphinPath(launchType);
    return new DolphinInstallation(launchType, dolphinPath);
  }

  public async installDolphin(
    dolphinType: DolphinLaunchType,
    onLogMessage: (message: string) => void = log.info,
  ): Promise<void> {
    const dolphinInstall = this.getInstallation(dolphinType);
    await dolphinInstall.validate(onLogMessage);
  }

  public async launchPlaybackDolphin(id: string, replayComm: ReplayCommunication): Promise<void> {
    const playbackInstallation = this.getInstallation(DolphinLaunchType.PLAYBACK);
    const dolphinPath = await playbackInstallation.findDolphinExecutable();
    const meleeIsoPath = await this._getIsoPath();

    const configuring = this.playbackDolphinInstances.get("configure");
    if (configuring) {
      throw new Error("Cannot open dolphin if a configuring dolphin is open.");
    }
    let playbackInstance = this.playbackDolphinInstances.get(id);
    if (!playbackInstance) {
      playbackInstance = new PlaybackDolphinInstance(dolphinPath, meleeIsoPath);
      playbackInstance.on("close", (code) => {
        this.emit("playback-dolphin-closed", id, code);

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete(id);
      });
      playbackInstance.on("error", (err: Error) => {
        log.error(err);
        throw err;
      });

      this.playbackDolphinInstances.set(id, playbackInstance);
    }

    await playbackInstance.play(replayComm);
  }

  public async launchNetplayDolphin() {
    if (this.netplayDolphinInstance) {
      throw new Error("Netplay dolphin is already open!");
    }

    await this._updateDolphinSettings(DolphinLaunchType.NETPLAY);

    const netplayInstallation = this.getInstallation(DolphinLaunchType.NETPLAY);
    const dolphinPath = await netplayInstallation.findDolphinExecutable();
    log.info(`Launching dolphin at path: ${dolphinPath}`);
    const launchMeleeOnPlay = this.settingsManager.get().settings.launchMeleeOnPlay;
    const meleeIsoPath = launchMeleeOnPlay ? await this._getIsoPath() : undefined;

    // Create the Dolphin instance and start it
    this.netplayDolphinInstance = new DolphinInstance(dolphinPath, meleeIsoPath);
    this.netplayDolphinInstance.on("close", (code) => {
      this.emit("netplay-dolphin-closed", code);
      this.netplayDolphinInstance = null;
      log.warn(`Dolphin exit code: ${code}`);
    });
    this.netplayDolphinInstance.on("error", (err: Error) => {
      log.error(err);
      throw err;
    });
    this.netplayDolphinInstance.start();
  }

  public async configureDolphin(launchType: DolphinLaunchType) {
    log.debug(`configuring ${launchType} dolphin...`);

    await this._updateDolphinSettings(launchType);

    const installation = this.getInstallation(launchType);
    const dolphinPath = await installation.findDolphinExecutable();
    if (launchType === DolphinLaunchType.NETPLAY && !this.netplayDolphinInstance) {
      const instance = new DolphinInstance(dolphinPath);
      this.netplayDolphinInstance = instance;
      instance.on("close", () => {
        this.emit("netplay-dolphin-closed");
        this.netplayDolphinInstance = null;
      });
      instance.on("error", (err: Error) => {
        log.error(err);
        throw err;
      });
      instance.start();
    } else if (launchType === DolphinLaunchType.PLAYBACK && this.playbackDolphinInstances.size === 0) {
      const instance = new PlaybackDolphinInstance(dolphinPath);
      this.playbackDolphinInstances.set("configure", instance);
      instance.on("close", (code) => {
        this.emit("playback-dolphin-closed", "configure", code);

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete("configure");
      });
      instance.on("error", (err: Error) => {
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

    const installation = this.getInstallation(launchType);
    await installation.downloadAndInstall({ log: log.info, cleanInstall: true });
    const isoPath = this.settingsManager.get().settings.isoPath;
    if (isoPath) {
      const gameDir = path.dirname(isoPath);
      await installation.addGamePath(gameDir);
    }
  }

  private async _getIsoPath(): Promise<string | undefined> {
    const meleeIsoPath = this.settingsManager.get().settings.isoPath ?? undefined;
    if (meleeIsoPath) {
      // Make sure the file actually exists
      if (!(await fileExists(meleeIsoPath))) {
        throw new Error(`Could not find ISO file: ${meleeIsoPath}`);
      }
    }
    return meleeIsoPath;
  }

  private async _updateDolphinSettings(launchType: DolphinLaunchType) {
    const installation = this.getInstallation(launchType);
    await installation.updateSettings({
      replayPath: this.settingsManager.getRootSlpPath(),
      useMonthlySubfolders: this.settingsManager.getUseMonthlySubfolders(),
    });
  }
}
