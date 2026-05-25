import type { SettingsManager } from "@settings/settings_manager";
import { app } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";

export type UpdateState = {
  status: "succeeded" | "failed";
  version: string;
};

const INSTALL_UPDATE_TIMEOUT_MS = 15000; // 15 seconds

export class AppUpdater {
  private updateState: UpdateState | undefined;

  constructor(private readonly settingsManager: SettingsManager) {
    autoUpdater.logger = log;
    autoUpdater.autoInstallOnAppQuit = settingsManager.get().settings.autoUpdateLauncher;

    // This is going to be the default at some point, right now if we don't
    // explicitly set this to true then electron-builder prints a (harmless)
    // warning when updating on Windows.
    // See: https://github.com/electron-userland/electron-builder/pull/6575
    autoUpdater.disableWebInstaller = true;
    // Disable differential downloads to fix Windows NSIS update issues
    // See: https://github.com/electron-userland/electron-builder/issues/9181
    autoUpdater.disableDifferentialDownload = true;
  }

  public async verifyPendingUpdate(): Promise<void> {
    const currentVersion = app.getVersion();
    const pendingVersion = this.settingsManager.get().pendingUpdateVersion;

    if (!pendingVersion) {
      return;
    }

    if (currentVersion === pendingVersion) {
      log.info(`Auto-update succeeded: version ${currentVersion}`);
      this.updateState = { status: "succeeded", version: currentVersion };
    } else {
      log.error(
        `Auto-update FAILED: expected ${pendingVersion}, running ${currentVersion}. ` +
          "Update file may have been missing, corrupted, or the installer was interrupted.",
      );
      this.updateState = { status: "failed", version: pendingVersion };
    }

    await this.settingsManager.updateSetting("pendingUpdateVersion", undefined);
  }

  public getUpdateState(): UpdateState | undefined {
    return this.updateState;
  }

  private async _installUpdate(): Promise<void> {
    const pendingVersion = this.settingsManager.get().pendingUpdateVersion;
    if (!pendingVersion) {
      throw new Error("No update has been downloaded.");
    }

    autoUpdater.quitAndInstall(false, true);
  }

  public async quitAndInstall(): Promise<void> {
    const timeout = new Promise<void>((_resolve, reject) => {
      // If we still haven't restarted the app within the timeout, something probably went wrong.
      setTimeout(() => {
        reject(new Error(`Timed out after ${INSTALL_UPDATE_TIMEOUT_MS / 1000}s trying to install update.`));
      }, INSTALL_UPDATE_TIMEOUT_MS);
    });

    await Promise.race([timeout, this._installUpdate()]);
  }
}
