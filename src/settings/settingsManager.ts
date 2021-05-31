import { DolphinLaunchType } from "@dolphin/types";
import electronSettings from "electron-settings";
import fs from "fs";
import merge from "lodash/merge";
import set from "lodash/set";

import { defaultAppSettings } from "./defaultSettings";
import { settingsUpdated } from "./ipc";
import { AppSettings } from "./types";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

export class SettingsManager {
  // This only stores the actually modified settings
  private appSettings: Partial<AppSettings>;

  public constructor() {
    const restoredSettings = electronSettings.getSync() as Partial<AppSettings>;

    // If the ISO file no longer exists, don't restore it
    if (restoredSettings.settings?.isoPath) {
      if (!fs.existsSync(restoredSettings.settings.isoPath)) {
        restoredSettings.settings.isoPath = null;
      }
    }
    this.appSettings = restoredSettings;
  }

  public get(): AppSettings {
    // Join the settings with our default settings.
    // This allows us to change the defaults without persisting them
    // into the storage.
    return merge({}, defaultAppSettings, this.appSettings);
  }

  public getDolphinPath(type: DolphinLaunchType): string {
    switch (type) {
      case DolphinLaunchType.NETPLAY:
        return this.get().settings.netplayDolphinPath;
      case DolphinLaunchType.PLAYBACK:
        return this.get().settings.playbackDolphinPath;
    }
  }

  public async setIsoPath(isoPath: string | null): Promise<void> {
    await this._set("settings.isoPath", isoPath);
  }

  public async setRootSlpPath(slpPath: string): Promise<void> {
    await this._set("settings.rootSlpPath", slpPath);
  }

  public async setSpectateSlpPath(slpPath: string): Promise<void> {
    await this._set("settings.spectateSlpPath", slpPath);
  }

  public async setNetplayDolphinPath(dolphinPath: string): Promise<void> {
    await this._set("settings.netplayDolphinPath", dolphinPath);
  }

  public async setPlaybackDolphinPath(dolphinPath: string): Promise<void> {
    await this._set("settings.playbackDolphinPath", dolphinPath);
  }

  private async _set(objectPath: string, value: any) {
    await electronSettings.set(objectPath, value);
    set(this.appSettings, objectPath, value);
    await settingsUpdated.main!.trigger(this.get());
  }
}

export const settingsManager = new SettingsManager();
