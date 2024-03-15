import { Preconditions } from "@common/preconditions";
import type { SettingsManager } from "@settings/settings_manager";
import { app } from "electron";
import electronLog from "electron-log";
import { move, remove } from "fs-extra";
import { Observable, Subject } from "observable-fns";
import os from "os";
import path from "path";
import { fileExists } from "utils/file_exists";

import { type DolphinVersionResponse, fetchLatestVersion } from "./install/fetch_latest_version";
import { IshiirukaDolphinInstallation } from "./install/ishiiruka_installation";
import { MainlineDolphinInstallation } from "./install/mainline_installation";
import { DolphinInstance, PlaybackDolphinInstance } from "./instance";
import type { DolphinEvent, DolphinInstallation, ReplayCommunication } from "./types";
import { DolphinEventType, DolphinLaunchType } from "./types";

const log = electronLog.scope("dolphin/manager");

// DolphinManager should be in control of all dolphin instances that get opened for actual use.
// This includes playing netplay, viewing replays, watching broadcasts (spectating), and configuring Dolphin.
export class DolphinManager {
  private betaFlags = {
    [DolphinLaunchType.NETPLAY]: {
      betaAvailable: false,
      promotedToStable: false,
    },
    [DolphinLaunchType.PLAYBACK]: {
      betaAvailable: false,
      promotedToStable: false,
    },
  };

  private playbackDolphinInstances = new Map<string, PlaybackDolphinInstance>();
  private netplayDolphinInstance: DolphinInstance | null = null;
  private eventSubject = new Subject<DolphinEvent>();
  public events = Observable.from(this.eventSubject);

  constructor(private settingsManager: SettingsManager) {
    this.betaFlags[DolphinLaunchType.NETPLAY].promotedToStable = settingsManager.getDolphinPromotedToStable(
      DolphinLaunchType.NETPLAY,
    );
    this.betaFlags[DolphinLaunchType.PLAYBACK].promotedToStable = settingsManager.getDolphinPromotedToStable(
      DolphinLaunchType.PLAYBACK,
    );
  }

  public getInstallation(launchType: DolphinLaunchType): DolphinInstallation {
    const { betaAvailable, promotedToStable } = this.betaFlags[launchType];
    if (betaAvailable || promotedToStable) {
      const betaSuffix = promotedToStable ? "" : "-beta";
      return new MainlineDolphinInstallation(launchType, betaSuffix);
    }
    return new IshiirukaDolphinInstallation(launchType);
  }

  public async installDolphin(dolphinType: DolphinLaunchType): Promise<void> {
    const useBeta = this.settingsManager.getUseDolphinBeta(dolphinType);
    let dolphinDownloadInfo: DolphinVersionResponse | undefined = undefined;
    try {
      dolphinDownloadInfo = await fetchLatestVersion(dolphinType, useBeta);
      await this._updateDolphinFlags(dolphinDownloadInfo, dolphinType);
    } catch (err) {
      log.error(`Failed to fetch latest Dolphin version: ${err}`);
      this._onOffline(dolphinType);
      return;
    }

    const dolphinInstall = this.getInstallation(dolphinType);
    await dolphinInstall.validate({
      onStart: () => this._onStart(dolphinType),
      onProgress: (current, total) => this._onProgress(dolphinType, current, total),
      onComplete: () =>
        dolphinInstall.getDolphinVersion().then((version) => {
          this._onComplete(dolphinType, version);
        }),
      dolphinDownloadInfo,
    });

    const isoPath = this.settingsManager.get().settings.isoPath;
    if (isoPath) {
      const gameDir = path.dirname(isoPath);
      await dolphinInstall.addGamePath(gameDir);
    }
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
      playbackInstance.on("close", async (exitCode) => {
        this.eventSubject.next({
          type: DolphinEventType.CLOSED,
          instanceId: id,
          dolphinType: DolphinLaunchType.PLAYBACK,
          exitCode,
        });

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
    Preconditions.checkState(this.netplayDolphinInstance == null, "Netplay dolphin is already open!");

    await this._updateDolphinSettings(DolphinLaunchType.NETPLAY);

    const netplayInstallation = this.getInstallation(DolphinLaunchType.NETPLAY);
    const dolphinPath = await netplayInstallation.findDolphinExecutable();
    log.info(`Launching dolphin at path: ${dolphinPath}`);
    const launchMeleeOnPlay = this.settingsManager.get().settings.launchMeleeOnPlay;
    const meleeIsoPath = launchMeleeOnPlay ? await this._getIsoPath() : undefined;

    // Create the Dolphin instance and start it
    this.netplayDolphinInstance = new DolphinInstance(dolphinPath, meleeIsoPath);
    this.netplayDolphinInstance.on("close", async (exitCode: number | null, signal: string | null) => {
      try {
        await this._updateLauncherSettings(DolphinLaunchType.NETPLAY);
      } catch (e) {
        log.error("Error encountered updating launcher settings.", e);
      }
      this.eventSubject.next({
        type: DolphinEventType.CLOSED,
        dolphinType: DolphinLaunchType.NETPLAY,
        exitCode,
      });

      this.netplayDolphinInstance = null;
      log.warn(`Dolphin exit code: ${exitCode?.toString(16)}`);
      log.warn(`Dolphin exit signal: ${signal}`);
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
      instance.on("close", async (exitCode) => {
        try {
          await this._updateLauncherSettings(launchType);
        } catch (e) {
          log.error("Error encountered updating launcher settings.", e);
        }
        this.eventSubject.next({
          type: DolphinEventType.CLOSED,
          dolphinType: DolphinLaunchType.NETPLAY,
          exitCode,
        });
        this.netplayDolphinInstance = null;
      });
      instance.on("error", (err: Error) => {
        log.error(err);
        throw err;
      });
      instance.start();
    } else if (launchType === DolphinLaunchType.PLAYBACK && this.playbackDolphinInstances.size === 0) {
      const instanceId = "configure";
      const instance = new PlaybackDolphinInstance(dolphinPath);
      this.playbackDolphinInstances.set(instanceId, instance);
      instance.on("close", async (exitCode) => {
        this.eventSubject.next({
          type: DolphinEventType.CLOSED,
          dolphinType: DolphinLaunchType.PLAYBACK,
          instanceId,
          exitCode,
        });

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete(instanceId);
      });
      instance.on("error", (err: Error) => {
        log.error(err);
        throw err;
      });
      instance.start();
    }
  }

  public async reinstallDolphin(launchType: DolphinLaunchType, cleanInstall?: boolean) {
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

    const useBeta = this.settingsManager.getUseDolphinBeta(launchType);
    let dolphinDownloadInfo: DolphinVersionResponse | undefined = undefined;
    try {
      dolphinDownloadInfo = await fetchLatestVersion(launchType, useBeta);
      await this._updateDolphinFlags(dolphinDownloadInfo, launchType);
    } catch (err) {
      log.error(`Failed to fetch latest Dolphin version: ${err}`);
      this._onOffline(launchType);
      return;
    }
    const installation = this.getInstallation(launchType);
    this._onStart(launchType);
    await installation.downloadAndInstall({
      dolphinDownloadInfo,
      cleanInstall,
      onProgress: (current, total) => this._onProgress(launchType, current, total),
    });

    const isoPath = this.settingsManager.get().settings.isoPath;
    if (isoPath) {
      const gameDir = path.dirname(isoPath);
      await installation.addGamePath(gameDir);
    }
    const version = await installation.getDolphinVersion();
    this._onComplete(launchType, version);
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

  public async importConfig(launchType: DolphinLaunchType, dolphinPath: string): Promise<void> {
    const installation = this.getInstallation(launchType);
    await installation.importConfig(dolphinPath);
    if (launchType === DolphinLaunchType.NETPLAY) {
      await this._updateLauncherSettings(launchType);
    }
  }

  private async _updateDolphinSettings(launchType: DolphinLaunchType) {
    const installation = this.getInstallation(launchType);
    await installation.updateSettings({
      replayPath: this.settingsManager.getRootSlpPath(),
      useMonthlySubfolders: this.settingsManager.getUseMonthlySubfolders(),
    });
  }

  private async _updateLauncherSettings(launchType: DolphinLaunchType) {
    const installation = this.getInstallation(launchType);
    const newSettings = await installation.getSettings();

    await this._updateLauncherSetting(
      this.settingsManager.getRootSlpPath(),
      path.normalize(newSettings.replayPath),
      (val) => this.settingsManager.setRootSlpPath(val),
    );
    await this._updateLauncherSetting(
      this.settingsManager.getUseMonthlySubfolders(),
      newSettings.useMonthlySubfolders,
      (val) => this.settingsManager.setUseMonthlySubfolders(val),
    );
    await this._updateLauncherSetting(
      this.settingsManager.get().settings.enableJukebox,
      newSettings.enableJukebox,
      (val) => this.settingsManager.setEnableJukebox(val),
    );
  }

  private async _updateLauncherSetting<T>(currentVal: T, newVal: T, update: (val: T) => Promise<void>) {
    if (currentVal === newVal) {
      return;
    }
    await update(newVal);
  }

  private _onStart(dolphinType: DolphinLaunchType) {
    this.eventSubject.next({
      type: DolphinEventType.DOWNLOAD_START,
      dolphinType,
    });
  }

  private _onProgress(dolphinType: DolphinLaunchType, current: number, total: number) {
    this.eventSubject.next({
      type: DolphinEventType.DOWNLOAD_PROGRESS,
      dolphinType,
      progress: { current, total },
    });
  }

  private _onComplete(dolphinType: DolphinLaunchType, dolphinVersion: string | null) {
    this.eventSubject.next({
      type: DolphinEventType.DOWNLOAD_COMPLETE,
      dolphinType,
      dolphinVersion,
    });
  }

  private _onOffline(dolphinType: DolphinLaunchType) {
    this.eventSubject.next({
      type: DolphinEventType.OFFLINE,
      dolphinType,
    });
  }

  // Run after fetchLatestVersion to update the necessary flags
  private async _updateDolphinFlags(downloadInfo: DolphinVersionResponse, dolphinType: DolphinLaunchType) {
    const isBeta = (downloadInfo.version as string).includes("-beta");
    const isMainline = downloadInfo.downloadUrls.win32.includes("project-slippi/dolphin");

    if (!this.betaFlags[dolphinType].promotedToStable && !isBeta && isMainline) {
      // if this is the first time we're handling the promotion then delete {dolphinType}-beta and move {dolphinType}
      // we want to delete the beta folder so that any defaults that got changed during the beta are properly updated
      const dolphinFolder = dolphinType === DolphinLaunchType.NETPLAY ? "netplay" : "playback";
      const betaPath = path.join(app.getPath("userData"), `${dolphinFolder}-beta`);
      const stablePath = path.join(app.getPath("userData"), dolphinFolder);
      const legacyPath = path.join(app.getPath("userData"), `${dolphinFolder}-legacy`);
      try {
        await remove(betaPath);
        await move(stablePath, legacyPath, { overwrite: true });
        if (process.platform === "darwin") {
          // mainline on macOS will take over the old user folder so move it on promotion
          // windows keeps everything contained in the install dir
          // linux will be using a new user folder path
          const configPath = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin");
          const oldUserFolderName = `${dolphinFolder}/User`;
          const legacyUserFolderName = `${dolphinFolder}/User-legacy`;
          const oldPath = path.join(configPath, oldUserFolderName);
          const newPath = path.join(configPath, legacyUserFolderName);
          await move(oldPath, newPath, { overwrite: true });
        }
        this.betaFlags[dolphinType].promotedToStable = true;
        await this.settingsManager.setDolphinPromotedToStable(dolphinType, true);
      } catch (err) {
        log.warn(`could not handle promotion: ${err}`);
      }
    }

    this.betaFlags[dolphinType].betaAvailable = isBeta;
  }
}
