import { DolphinLaunchType } from "@dolphin/types";
import { Mutex } from "async-mutex";
import electronSettings from "electron-settings";
import fs from "fs";
import merge from "lodash/merge";
import set from "lodash/set";

import { defaultAppSettings } from "./default_settings";
import { ipc_settingsUpdatedEvent } from "./ipc";
import type { AppSettings, StoredConnection } from "./types";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

export class SettingsManager {
  // This only stores the actually modified settings
  private appSettings: Partial<AppSettings>;
  private setMutex: Mutex;

  constructor() {
    this.setMutex = new Mutex();
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

  public getRootSlpPath(): string {
    return this.get().settings.rootSlpPath;
  }

  public getUseMonthlySubfolders(): boolean {
    return this.get().settings.useMonthlySubfolders;
  }

  public getUseDolphinBeta(type: DolphinLaunchType): boolean {
    const settings = this.get().settings;
    switch (type) {
      case DolphinLaunchType.NETPLAY:
        return settings.useNetplayBeta;
      case DolphinLaunchType.PLAYBACK:
        return settings.usePlaybackBeta;
    }
  }

  public getDolphinPromotedToStable(type: DolphinLaunchType): boolean {
    const settings = this.get();
    switch (type) {
      case DolphinLaunchType.NETPLAY:
        return settings.netplayPromotedToStable;
      case DolphinLaunchType.PLAYBACK:
        return settings.playbackPromotedToStable;
    }
  }

  public async setIsoPath(isoPath: string | null): Promise<void> {
    await this._set("settings.isoPath", isoPath);
  }

  public async setRootSlpPath(slpPath: string): Promise<void> {
    await this._set("settings.rootSlpPath", slpPath);
  }

  public async setUseMonthlySubfolders(toggle: boolean): Promise<void> {
    await this._set("settings.useMonthlySubfolders", toggle);
  }

  public async setEnableJukebox(toggle: boolean): Promise<void> {
    await this._set("settings.enableJukebox", toggle);
  }

  public async setSpectateSlpPath(slpPath: string): Promise<void> {
    await this._set("settings.spectateSlpPath", slpPath);
  }

  public async setExtraSlpPaths(slpPaths: string[]): Promise<void> {
    await this._set("settings.extraSlpPaths", slpPaths);
  }

  public async setLaunchMeleeOnPlay(launchMelee: boolean): Promise<void> {
    await this._set("settings.launchMeleeOnPlay", launchMelee);
  }

  public async setAutoUpdateLauncher(autoUpdateLauncher: boolean): Promise<void> {
    await this._set("settings.autoUpdateLauncher", autoUpdateLauncher);
  }

  public async setUseDolphinBeta(dolphinType: DolphinLaunchType, useBeta: boolean): Promise<void> {
    switch (dolphinType) {
      case DolphinLaunchType.NETPLAY:
        await this._set("settings.useNetplayBeta", useBeta);
        break;
      case DolphinLaunchType.PLAYBACK:
        await this._set("settings.usePlaybackBeta", useBeta);
        break;
    }
  }

  public async setDolphinPromotedToStable(dolphinType: DolphinLaunchType, promotedToStable: boolean): Promise<void> {
    switch (dolphinType) {
      case DolphinLaunchType.NETPLAY:
        await this._set("netplayPromotedToStable", promotedToStable);
        break;
      case DolphinLaunchType.PLAYBACK:
        await this._set("playbackPromotedToStable", promotedToStable);
        break;
    }
  }

  public async addConsoleConnection(conn: Omit<StoredConnection, "id">): Promise<void> {
    const connections = this.get().connections;
    // Auto-generate an ID
    let prevId = 0;
    if (connections.length > 0) {
      prevId = Math.max(...connections.map((c) => c.id));
    }
    connections.push({ id: prevId + 1, ...conn });
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
    await this.setMutex.acquire();
    await electronSettings.set(objectPath, value);
    set(this.appSettings, objectPath, value);
    await ipc_settingsUpdatedEvent.main!.trigger(this.get());
    this.setMutex.release();
  }
}
