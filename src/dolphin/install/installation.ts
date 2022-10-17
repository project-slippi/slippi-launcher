import { addGamePath, setSlippiSettings } from "@dolphin/config/config";
import { IniFile } from "@dolphin/config/iniFile";
import { findDolphinExecutable } from "@dolphin/util";
import { spawnSync } from "child_process";
import { app } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { lt } from "semver";

import { DolphinLaunchType } from "../types";
import { downloadLatestDolphin } from "./download";
import type { DolphinVersionResponse } from "./fetchLatestVersion";
import { fetchLatestVersion } from "./fetchLatestVersion";

const isLinux = process.platform === "linux";

// taken from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semverRegex =
  /(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;

export class DolphinInstallation {
  constructor(private dolphinLaunchType: DolphinLaunchType, private installationFolder: string) {}

  public get userFolder(): string {
    switch (process.platform) {
      case "win32": {
        return path.join(this.installationFolder, "User");
      }
      case "darwin": {
        return path.join(this.installationFolder, "Slippi Dolphin.app", "Contents", "Resources", "User");
      }
      case "linux": {
        const configPath = path.join(os.homedir(), ".config");
        const userFolderName = this.dolphinLaunchType === DolphinLaunchType.NETPLAY ? "SlippiOnline" : "SlippiPlayback";
        return path.join(configPath, userFolderName);
      }
      default:
        throw new Error(`Unsupported operating system: ${process.platform}`);
    }
  }

  public get sysFolder(): string {
    const dolphinPath = this.installationFolder;
    const type = this.dolphinLaunchType;
    switch (process.platform) {
      case "win32": {
        return path.join(dolphinPath, "Sys");
      }
      case "darwin": {
        return path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "Sys");
      }
      case "linux": {
        return path.join(app.getPath("userData"), type, "Sys");
      }
      default:
        throw new Error(`Unsupported operating system: ${process.platform}`);
    }
  }

  public async findDolphinExecutable(): Promise<string> {
    const dolphinPath = this.installationFolder;
    const type = this.dolphinLaunchType;

    return findDolphinExecutable(type, dolphinPath);
  }

  public async clearCache() {
    const cacheFolder = path.join(this.userFolder, "Cache");
    await fs.remove(cacheFolder);
  }

  public async importConfig(fromPath: string) {
    const newUserFolder = this.userFolder;
    await fs.ensureDir(this.userFolder);
    const oldUserFolder = path.join(fromPath, "User");

    if (!(await fs.pathExists(oldUserFolder))) {
      return;
    }

    await fs.copy(oldUserFolder, newUserFolder, { overwrite: true });

    // we shouldn't keep the old cache folder since it might be out of date
    await this.clearCache();
  }

  public async validate({
    onProgress,
    onComplete,
  }: {
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
  }): Promise<void> {
    const type = this.dolphinLaunchType;
    let dolphinDownloadInfo: DolphinVersionResponse | undefined = undefined;

    try {
      await this.findDolphinExecutable();
      log.info(`Found existing ${type} Dolphin executable.`);
      log.info(`Checking if we need to update ${type} Dolphin`);

      try {
        dolphinDownloadInfo = await fetchLatestVersion(type);
      } catch (err) {
        log.error(`Failed to fetch latest Dolphin version: ${err}`);
        onComplete();
        return;
      }

      const latestVersion = dolphinDownloadInfo?.version;
      const isOutdated = !latestVersion || (await this._isOutOfDate(latestVersion));
      if (!isOutdated) {
        log.info("No update found...");
        onComplete();
        return;
      }

      log.info(`${type} Dolphin installation is outdated. Downloading latest...`);
    } catch (err) {
      log.info(`Could not find ${type} Dolphin installation. Downloading...`);
    }

    // Start the download
    await this.downloadAndInstall({
      releaseInfo: dolphinDownloadInfo,
      onProgress,
      onComplete,
    });
  }

  public async downloadAndInstall({
    releaseInfo,
    onProgress,
    onComplete,
    cleanInstall,
  }: {
    releaseInfo?: DolphinVersionResponse;
    onProgress?: (current: number, total: number) => void;
    onComplete?: () => void;
    cleanInstall?: boolean;
  }): Promise<void> {
    const type = this.dolphinLaunchType;
    let dolphinDownloadInfo = releaseInfo;
    if (!dolphinDownloadInfo) {
      dolphinDownloadInfo = await fetchLatestVersion(type);
    }

    const downloadUrl = dolphinDownloadInfo.downloadUrls[process.platform];
    if (!downloadUrl) {
      throw new Error(`Could not find latest Dolphin download url for ${process.platform}`);
    }

    const downloadDir = path.join(app.getPath("userData"), "temp");
    const downloadedAsset = await downloadLatestDolphin(downloadUrl, downloadDir, onProgress);
    log.info(`Installing v${dolphinDownloadInfo.version} ${type} Dolphin...`);
    await this._installDolphin(downloadedAsset, cleanInstall);
    log.info(`Finished v${dolphinDownloadInfo.version} ${type} Dolphin install`);

    if (onComplete) {
      onComplete();
    }
  }

  public async addGamePath(gameDir: string): Promise<void> {
    const iniPath = path.join(this.userFolder, "Config", "Dolphin.ini");
    const iniFile = await IniFile.init(iniPath);
    await addGamePath(iniFile, gameDir);
  }

  public async updateSettings(options: Partial<{ useMonthlySubfolders: boolean; replayPath: string }>): Promise<void> {
    const iniPath = path.join(this.userFolder, "Config", "Dolphin.ini");
    const iniFile = await IniFile.init(iniPath);
    await setSlippiSettings(iniFile, options);
  }

  private async _isOutOfDate(latestVersion: string): Promise<boolean> {
    const dolphinPath = await this.findDolphinExecutable();
    const dolphinVersionOut = spawnSync(dolphinPath, ["--version"]).stdout.toString();
    const match = dolphinVersionOut.match(semverRegex);
    const dolphinVersion = match?.[0] ?? "";
    return lt(dolphinVersion, latestVersion);
  }

  private async _uninstallDolphin() {
    await fs.remove(this.installationFolder);
    if (isLinux) {
      await fs.remove(this.userFolder);
    }
  }

  private async _installDolphin(assetPath: string, cleanInstall = false) {
    const dolphinPath = this.installationFolder;

    if (cleanInstall) {
      await this._uninstallDolphin();
    } else {
      await this.clearCache(); // clear cache to avoid shader issues on new versions
    }

    switch (process.platform) {
      case "win32": {
        const { installDolphinOnWindows } = await import("./windows");
        await installDolphinOnWindows({ assetPath, destinationFolder: dolphinPath });
        break;
      }
      case "darwin": {
        const { installDolphinOnMac } = await import("./macos");
        await installDolphinOnMac({ assetPath, destinationFolder: dolphinPath });
        break;
      }
      case "linux": {
        const { installDolphinOnLinux } = await import("./linux");
        await installDolphinOnLinux({
          type: this.dolphinLaunchType,
          assetPath,
          destinationFolder: dolphinPath,
        });
        break;
      }
      default: {
        throw new Error(
          `Installing ${this.dolphinLaunchType} Dolphin is not supported on this platform: ${process.platform}`,
        );
      }
    }
    await fs.remove(assetPath).catch((err) => {
      log.error(`Could not delete dolphin asset: ${err}`);
    });
  }
}
