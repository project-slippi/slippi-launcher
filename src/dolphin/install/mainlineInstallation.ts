import type { SyncedDolphinSettings } from "@dolphin/config/config";
import { addGamePath, getSlippiMainlineSettings, setSlippiMainlineSettings } from "@dolphin/config/config";
import { IniFile } from "@dolphin/config/iniFile";
import { spawnSync } from "child_process";
import { app } from "electron";
import electronLog from "electron-log";
import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { lt } from "semver";
import semverRegex from "semver-regex";

import type { DolphinInstallation } from "../types";
import { DolphinLaunchType } from "../types";
import { downloadLatestDolphin } from "./download";
import type { DolphinVersionResponse } from "./fetchLatestVersion";

const log = electronLog.scope("dolphin/installation");

const isLinux = process.platform === "linux";

export class MainlineDolphinInstallation implements DolphinInstallation {
  public readonly installationFolder: string;
  constructor(private readonly dolphinLaunchType: DolphinLaunchType, private readonly betaSuffix: string) {
    const dolphinFolder = dolphinLaunchType === DolphinLaunchType.NETPLAY ? "netplay" : "playback";
    this.installationFolder = path.join(app.getPath("userData"), `${dolphinFolder}${this.betaSuffix}`);
  }

  public get userFolder(): string {
    switch (process.platform) {
      case "win32": {
        return path.join(this.installationFolder, "User");
      }
      case "darwin": {
        const configPath = path.join(os.homedir(), "Library", "Application Support", `com.project-slippi.dolphin`);
        const userFolderName =
          this.dolphinLaunchType === DolphinLaunchType.NETPLAY
            ? `netplay${this.betaSuffix}/User`
            : `playback${this.betaSuffix}/User`;

        return path.join(configPath, userFolderName);
      }
      case "linux": {
        const configPath = path.join(os.homedir(), ".config");
        const userFolderName =
          this.dolphinLaunchType === DolphinLaunchType.NETPLAY
            ? `slippi-dolphin/netplay${this.betaSuffix}`
            : `slippi-dolphin/playback${this.betaSuffix}`;
        return path.join(configPath, userFolderName);
      }
      default:
        throw new Error(`Unsupported operating system: ${process.platform}`);
    }
  }

  public get sysFolder(): string {
    const dolphinPath = this.installationFolder;
    switch (process.platform) {
      case "linux":
      case "win32": {
        return path.join(dolphinPath, "Sys");
      }
      case "darwin": {
        const dolphinApp = "Slippi_Dolphin.app";
        return path.join(dolphinPath, dolphinApp, "Contents", "Resources", "Sys");
      }
      default:
        throw new Error(`Unsupported operating system: ${process.platform}`);
    }
  }

  public async findDolphinExecutable(): Promise<string> {
    const dolphinPath = this.installationFolder;
    const type = this.dolphinLaunchType;

    // Make sure the directory actually exists
    await fs.ensureDir(dolphinPath);

    // Check the directory contents
    const files = await fs.readdir(dolphinPath);
    const result = files.find((filename) => {
      switch (process.platform) {
        case "win32":
          return filename.endsWith("Dolphin.exe");
        case "darwin":
          return filename.endsWith("Dolphin.app");
        case "linux": {
          const appimagePrefix = type === DolphinLaunchType.NETPLAY ? "Slippi_Netplay" : "Slippi_Playback";
          const isAppimage = filename.startsWith(appimagePrefix) && filename.endsWith("AppImage");
          return isAppimage || filename.endsWith("dolphin-emu");
        }
        default:
          return false;
      }
    });

    if (!result) {
      throw new Error(
        `No ${type} Dolphin found in: ${dolphinPath}, try restarting the launcher. Ask in the Slippi Discord's support channels for further help`,
      );
    }

    if (process.platform === "darwin") {
      const dolphinBinaryPath = path.join(dolphinPath, result, "Contents", "MacOS", "Slippi_Dolphin");
      const dolphinExists = await fs.pathExists(dolphinBinaryPath);
      if (!dolphinExists) {
        throw new Error(`No ${type} Dolphin found in: ${dolphinPath}, try resetting dolphin`);
      }
      return dolphinBinaryPath;
    }

    return path.join(dolphinPath, result);
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
    onStart,
    onProgress,
    onComplete,
    dolphinDownloadInfo,
  }: {
    onStart: () => void;
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
    dolphinDownloadInfo: DolphinVersionResponse;
  }): Promise<void> {
    const type = this.dolphinLaunchType;

    try {
      await this.findDolphinExecutable();
      log.info(`Found existing ${type} Dolphin executable.`);
      log.info(`Checking if we need to update ${type} Dolphin`);

      const latestVersion = dolphinDownloadInfo?.version;
      const isOutdated = !latestVersion || (await this._isOutOfDate(latestVersion));
      log.warn(`latest version = ${latestVersion}`);
      if (!isOutdated) {
        log.info("No update found...");
        onComplete();
        return;
      }

      onStart();

      log.info(`${type} Dolphin installation is outdated. Downloading latest...`);
    } catch (err) {
      log.info(`Could not find ${type} Dolphin installation. Downloading...`);
    }

    // Start the download
    await this.downloadAndInstall({
      dolphinDownloadInfo,
      onProgress,
      onComplete,
    });
  }

  public async downloadAndInstall({
    dolphinDownloadInfo,
    onProgress,
    onComplete,
    cleanInstall,
  }: {
    dolphinDownloadInfo: DolphinVersionResponse;
    onProgress?: (current: number, total: number) => void;
    onComplete?: () => void;
    cleanInstall?: boolean;
  }): Promise<void> {
    const type = this.dolphinLaunchType;

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

  public async getSettings(): Promise<SyncedDolphinSettings> {
    const iniPath = path.join(this.userFolder, "Config", "Dolphin.ini");
    const iniFile = await IniFile.init(iniPath);
    return await getSlippiMainlineSettings(iniFile);
  }

  public async updateSettings(options: Partial<SyncedDolphinSettings>): Promise<void> {
    const iniPath = path.join(this.userFolder, "Config", "Dolphin.ini");
    const iniFile = await IniFile.init(iniPath);
    await setSlippiMainlineSettings(iniFile, options);
  }

  private async _isOutOfDate(latestVersion: string): Promise<boolean> {
    const dolphinVersion = await this.getDolphinVersion();
    log.info(`dolphin version = ${dolphinVersion}`);
    return !dolphinVersion || lt(dolphinVersion, latestVersion);
  }

  public async getDolphinVersion(): Promise<string | null> {
    try {
      const dolphinPath = await this.findDolphinExecutable();
      log.warn(`dolphinPath = ${dolphinPath}`);
      const dolphinVersionOut = spawnSync(dolphinPath, ["--version"]).stdout.toString();
      log.warn(`dolphinVersionOut = ${dolphinVersionOut}`);
      const match = dolphinVersionOut.match(semverRegex());
      return match?.[0] ?? null;
    } catch (err) {
      return null;
    }
  }

  public async findPlayKey(): Promise<string> {
    const slippiDir = path.join(this.userFolder, "Slippi");
    await fs.ensureDir(slippiDir);
    return path.resolve(slippiDir, "user.json");
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
        const { installMainlineDolphinOnMac } = await import("./macos");
        await installMainlineDolphinOnMac({
          assetPath,
          destinationFolder: dolphinPath,
        });
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
