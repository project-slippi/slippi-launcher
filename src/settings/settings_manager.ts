import { DolphinLaunchType } from "@dolphin/types";
import { Mutex } from "async-mutex";
import electronSettings from "electron-settings";
import { EventEmitter } from "events";
import fs from "fs";
import merge from "lodash/merge";
import set from "lodash/set";

import { defaultAppSettings } from "./default_settings";
import { ipc_settingChangedEvent } from "./ipc";
import type {
  AppSettings,
  RootSettingsSchema,
  SettingKey,
  SettingsSchema,
  SettingUpdate,
  StoredConnection,
} from "./types";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

/**
 * Event emitted when a setting changes
 */
export interface SettingChangeEvent<K extends SettingKey = SettingKey> {
  key: K;
  value: K extends keyof SettingsSchema
    ? SettingsSchema[K]
    : K extends keyof RootSettingsSchema
    ? RootSettingsSchema[K]
    : any;
  previousValue: any;
}

/**
 * Type-safe event map for SettingsManager
 * This allows TypeScript to know what events exist and their payload types
 */
export interface SettingsManagerEvents {
  settingChange: (event: SettingChangeEvent) => void;
}

/**
 * Type-safe SettingsManager that emits properly typed events
 * Uses declaration merging to add type-safe event methods
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface SettingsManager {
  on<E extends keyof SettingsManagerEvents>(event: E, listener: SettingsManagerEvents[E]): this;
  off<E extends keyof SettingsManagerEvents>(event: E, listener: SettingsManagerEvents[E]): this;
  emit<E extends keyof SettingsManagerEvents>(event: E, ...args: Parameters<SettingsManagerEvents[E]>): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SettingsManager extends EventEmitter {
  // This only stores the actually modified settings
  private appSettings: Partial<AppSettings>;
  private setMutex: Mutex;

  constructor() {
    super();
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

  /**
   * Subscribe to changes for a specific setting
   * Returns an unsubscribe function
   *
   * @example
   * const unsubscribe = settingsManager.onSettingChange("isoPath", (event) => {
   *   console.log("ISO path changed from", event.previousValue, "to", event.value);
   *   // event.value is automatically typed as string | null ✓
   * });
   */
  public onSettingChange<K extends SettingKey>(
    key: K,
    callback: (
      value: K extends keyof SettingsSchema
        ? SettingsSchema[K]
        : K extends keyof RootSettingsSchema
        ? RootSettingsSchema[K]
        : never,
      previousValue: K extends keyof SettingsSchema
        ? SettingsSchema[K]
        : K extends keyof RootSettingsSchema
        ? RootSettingsSchema[K]
        : never,
    ) => void | Promise<void>,
  ): () => void {
    const listener = (event: SettingChangeEvent) => {
      if (event.key === key) {
        void Promise.resolve(callback(event.value as any, event.previousValue as any));
      }
    };

    this.on("settingChange", listener);

    return () => {
      this.off("settingChange", listener);
    };
  }

  /**
   * Subscribe to changes for multiple settings
   * Returns an unsubscribe function
   */
  public onSettingsChange(
    keys: SettingKey[],
    callback: (event: SettingChangeEvent) => void | Promise<void>,
  ): () => void {
    const listener = (event: SettingChangeEvent) => {
      if (keys.includes(event.key)) {
        void Promise.resolve(callback(event));
      }
    };

    this.on("settingChange", listener);

    return () => {
      this.off("settingChange", listener);
    };
  }

  /**
   * Subscribe to all setting changes
   * Returns an unsubscribe function
   */
  public onAnySettingChange(callback: (event: SettingChangeEvent) => void | Promise<void>): () => void {
    this.on("settingChange", callback);

    return () => {
      this.off("settingChange", callback);
    };
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

  /**
   * Add a new console connection
   */
  public async addConsoleConnection(conn: Omit<StoredConnection, "id">): Promise<void> {
    const connections = this.get().connections;
    // Auto-generate an ID
    let prevId = 0;
    if (connections.length > 0) {
      prevId = Math.max(...connections.map((c) => c.id));
    }
    connections.push({ id: prevId + 1, ...conn });
    await this.updateSetting("connections", connections);
  }

  /**
   * Edit an existing console connection
   */
  public async editConsoleConnection(id: number, conn: Omit<StoredConnection, "id">): Promise<void> {
    const connections = this.get().connections;
    const index = connections.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Could not find console connection with id: ${id}`);
    }

    connections[index] = { id, ...conn };
    await this.updateSetting("connections", connections);
  }

  /**
   * Delete a console connection
   */
  public async deleteConsoleConnection(id: number): Promise<void> {
    const connections = this.get().connections.filter((c) => c.id !== id);
    await this.updateSetting("connections", connections);
  }

  /**
   * Set whether Dolphin beta is used (for backward compatibility with DolphinManager)
   */
  public async setUseDolphinBeta(dolphinType: DolphinLaunchType, useBeta: boolean): Promise<void> {
    const key = dolphinType === DolphinLaunchType.NETPLAY ? "useNetplayBeta" : "usePlaybackBeta";
    await this.updateSetting(key, useBeta);
  }

  /**
   * Set whether Dolphin has been promoted to stable (internal use)
   */
  public async setDolphinPromotedToStable(dolphinType: DolphinLaunchType, promotedToStable: boolean): Promise<void> {
    const key = dolphinType === DolphinLaunchType.NETPLAY ? "netplayPromotedToStable" : "playbackPromotedToStable";
    await this.updateSetting(key, promotedToStable);
  }

  /**
   * NEW: Generic setting update method
   * Updates a single setting and emits change event
   */
  public async updateSetting<K extends SettingKey>(
    key: K,
    value: K extends keyof SettingsSchema
      ? SettingsSchema[K]
      : K extends keyof RootSettingsSchema
      ? RootSettingsSchema[K]
      : never,
  ): Promise<void> {
    // Determine the object path (settings are nested, root-level are not)
    const objectPath = this.isNestedSetting(key) ? `settings.${key}` : key;

    // Get previous value for the event
    const currentSettings = this.get();
    const previousValue: any = this.isNestedSetting(key)
      ? currentSettings.settings[key as keyof SettingsSchema]
      : (currentSettings as any)[key];

    // Update the setting value
    await this.setMutex.acquire();
    await electronSettings.set(objectPath, value as any);
    set(this.appSettings, objectPath, value);

    // Emit change event for subscribers (side effects handled by subscribers)
    this.emit("settingChange", { key, value, previousValue });

    // Broadcast incremental change to renderer windows
    await ipc_settingChangedEvent.main!.trigger({ updates: [{ key, value }] });
    this.setMutex.release();
  }

  /**
   * NEW: Batch update multiple settings
   * More efficient than calling updateSetting multiple times
   */
  public async updateSettings(updates: SettingUpdate[]): Promise<void> {
    await this.setMutex.acquire();

    // Get current settings for previous values
    const currentSettings = this.get();

    // Update all values
    for (const update of updates) {
      const objectPath = this.isNestedSetting(update.key) ? `settings.${update.key}` : update.key;
      await electronSettings.set(objectPath, update.value as any);
      set(this.appSettings, objectPath, update.value);
    }

    // Emit change events for all updates (side effects handled by subscribers)
    for (const update of updates) {
      const previousValue: any = this.isNestedSetting(update.key)
        ? currentSettings.settings[update.key as keyof SettingsSchema]
        : (currentSettings as any)[update.key];

      this.emit("settingChange", { key: update.key, value: update.value, previousValue });
    }

    // Single incremental broadcast for all changes
    await ipc_settingChangedEvent.main!.trigger({ updates });
    this.setMutex.release();
  }

  /**
   * Check if a setting is nested under "settings" or at root level
   */
  private isNestedSetting(key: SettingKey): key is keyof SettingsSchema {
    const nestedKeys: Array<keyof SettingsSchema> = [
      "isoPath",
      "rootSlpPath",
      "spectateSlpPath",
      "extraSlpPaths",
      "useMonthlySubfolders",
      "enableJukebox",
      "launchMeleeOnPlay",
      "autoUpdateLauncher",
      "useNetplayBeta",
      "usePlaybackBeta",
    ];
    return nestedKeys.includes(key as any);
  }
}
