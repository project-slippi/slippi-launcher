import { DolphinLaunchType } from "@dolphin/types";
import electronSettings from "electron-settings";
import fs from "fs";
import merge from "lodash/merge";
import set from "lodash/set";

import { defaultAppSettings } from "./defaultSettings";
import { settingsUpdated } from "./ipc";
import { AppSettings, StoredConnection } from "./types";

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

  public async addConsoleConnection(conn: Omit<StoredConnection, "id">): Promise<void> {
    const connections = this.get().connections;
    // Auto-generate an ID
    let nextId = 0;
    if (connections.length > 0) {
      nextId = Math.max(...connections.map((c) => c.id)) + 1;
    }
    connections.push({ id: nextId, ...conn });
    await this._set("connections", connections);
  }

  public async editConsoleConnection(id: number, conn: Omit<StoredConnection, "id">): Promise<void> {
    const connections = this.get().connections;
    const index = connections.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Could not find console connection with id: ${id}`);
    }

    connections[index] = { id, ...conn };
    await this._set("connections", connections);
  }

  public async deleteConsoleConnection(id: number): Promise<void> {
    const connections = this.get().connections.filter((c) => c.id !== id);
    await this._set("connections", connections);
  }

  private async _set(objectPath: string, value: any) {
    await electronSettings.set(objectPath, value);
    set(this.appSettings, objectPath, value);
    await settingsUpdated.main!.trigger(this.get());
  }
}

export const settingsManager = new SettingsManager();
