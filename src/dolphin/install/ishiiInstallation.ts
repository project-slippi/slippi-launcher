import type { SyncedDolphinSettings } from "@dolphin/config/config";
import { addGamePath, getSlippiIshiiSettings, setSlippiIshiiSettings } from "@dolphin/config/config";
import { IniFile } from "@dolphin/config/iniFile";
import { spawnSync } from "child_process";
import { app } from "electron";
import electronLog from "electron-log";
import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { lt } from "semver";

import type { DolphinInstallation } from "../types";
import { DolphinLaunchType } from "../types";
import { downloadLatestDolphin } from "./download";
import type { DolphinVersionResponse } from "./fetchLatestVersion";

const log = electronLog.scope("dolphin/ishiiInstallation");

const isLinux = process.platform === "linux";

// taken from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semverRegex =
  /(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;

export class IshiirukaDolphinInstallation implements DolphinInstallation {
  public readonly installationFolder: string;
  constructor(private readonly dolphinLaunchType: DolphinLaunchType) {
    const dolphinFolder = dolphinLaunchType === DolphinLaunchType.NETPLAY ? "netplay" : "playback";
    this.installationFolder = path.join(app.getPath("userData"), dolphinFolder);
  }

  public get userFolder(): string {
    switch (process.platform) {
      case "win32": {
        return path.join(this.installationFolder, "User");
      }
      case "darwin": {
        const configPath = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin");
        const dolphinFolder = this.dolphinLaunchType === DolphinLaunchType.NETPLAY ? "netplay" : "playback";
        const userFolderName = `${dolphinFolder}/User`;

        return path.join(configPath, userFolderName);
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
    switch (process.platform) {
      case "linux":
      case "win32": {
        return path.join(dolphinPath, "Sys");
      }
      case "darwin": {
        return path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "Sys");
      }
      default:
        throw new Error(`Unsupported operating system: ${process.platform}`);
    }
  }

  public async findDolphinExecutable(): Promise<string> {
    const dolphinPath = this.installationFolder;
    const type = this.dolphinLaunchType;
    // Check the directory contents
    const files = await fs.readdir(dolphinPath);
    const result = files.find((filename) => {
      switch (process.platform) {
        case "win32":
          return filename.endsWith("Dolphin.exe");
        case "darwin":
          return filename.endsWith("Dolphin.app");
        case "linux": {
          const appimagePrefix = type === DolphinLaunchType.NETPLAY ? "Slippi_Online" : "Slippi_Playback";
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
      const dolphinBinaryPath = path.join(dolphinPath, result, "Contents", "MacOS", "Slippi Dolphin");
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

    const downloadUrl = this.getPlatformSpecificDownloadLink(dolphinDownloadInfo);
    const downloadDir = path.join(app.getPath("userData"), "temp");
    const downloadedAsset = await downloadLatestDolphin(downloadUrl, downloadDir, onProgress);
    log.info(`Installing v${dolphinDownloadInfo.version} ${type} Dolphin...`);
    await this._installDolphin(downloadedAsset, cleanInstall);
    log.info(`Finished v${dolphinDownloadInfo.version} ${type} Dolphin install`);

    if (onComplete) {
      onComplete();
    }
  }

  private getPlatformSpecificDownloadLink(downloadInfo: DolphinVersionResponse): string {
    switch (process.platform) {
      case "linux":
        return downloadInfo.downloadUrls.linux;
      case "darwin":
        return downloadInfo.downloadUrls.darwin;
      case "win32":
        return downloadInfo.downloadUrls.win32;
      default:
        throw new Error(`Could not find latest Dolphin download url for ${process.platform}`);
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
    return await getSlippiIshiiSettings(iniFile);
  }

  public async updateSettings(options: Partial<SyncedDolphinSettings>): Promise<void> {
    const iniPath = path.join(this.userFolder, "Config", "Dolphin.ini");
    const iniFile = await IniFile.init(iniPath);
    await setSlippiIshiiSettings(iniFile, options);
  }

  private async _isOutOfDate(latestVersion: string): Promise<boolean> {
    const dolphinVersion = await this.getDolphinVersion();
    return !dolphinVersion || lt(dolphinVersion, latestVersion);
  }

  public async getDolphinVersion(): Promise<string | null> {
    try {
      const dolphinPath = await this.findDolphinExecutable();
      const dolphinVersionOut = spawnSync(dolphinPath, ["--version"]).stdout.toString();
      const match = dolphinVersionOut.match(semverRegex);
      return match?.[0] ?? null;
    } catch (err) {
      return null;
    }
  }

  public async findPlayKey(): Promise<string> {
    let slippiDir = "";
    switch (process.platform) {
      case "linux":
      case "win32": {
        slippiDir = path.join(this.userFolder, "Slippi");
        break;
      }
      case "darwin": {
        slippiDir = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin", "Slippi");
        break;
      }
      default: {
        break;
      }
    }
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
        const { installIshiirukaDolphinOnMac } = await import("./macos");
        await installIshiirukaDolphinOnMac({
          assetPath,
          destinationFolder: dolphinPath,
        });
        break;
      }
      case "linux": {
        const { installDolphinOnLinux } = await import("./linux");
        await installDolphinOnLinux({
          assetPath,
          destinationFolder: dolphinPath,
          installation: this,
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
