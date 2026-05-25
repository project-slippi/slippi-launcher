import log from "electron-log";
import { autoUpdater } from "electron-updater";

export class AppUpdater {
  constructor(private readonly shouldAutoUpdate: boolean) {
    autoUpdater.logger = log;
    autoUpdater.autoInstallOnAppQuit = this.shouldAutoUpdate;

    // This is going to be the default at some point, right now if we don't
    // explicitly set this to true then electron-builder prints a (harmless)
    // warning when updating on Windows.
    // See: https://github.com/electron-userland/electron-builder/pull/6575
    autoUpdater.disableWebInstaller = true;
    // Disable differential downloads to fix Windows NSIS update issues
    // See: https://github.com/electron-userland/electron-builder/issues/9181
    autoUpdater.disableDifferentialDownload = true;
  }
}
