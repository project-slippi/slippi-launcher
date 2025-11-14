/* eslint-disable import/no-default-export */
import { ipcRenderer } from "electron";

import {
  ipc_addNewConnection,
  ipc_deleteConnection,
  ipc_editConnection,
  ipc_openSettingsModalEvent,
  ipc_settingChangedEvent,
  ipc_settingsUpdatedEvent,
  ipc_updateSettings,
} from "./ipc";
import type { AppSettings, SettingUpdate, StoredConnection } from "./types";

export default {
  /**
   * Get settings synchronously (called once on app init)
   */
  getAppSettingsSync() {
    return ipcRenderer.sendSync("getAppSettingsSync") as AppSettings;
  },

  /**
   * Subscribe to settings updates from main process (full state sync)
   * This is primarily for compatibility or full state refreshes
   */
  onSettingsUpdated(handle: (settings: AppSettings) => void) {
    const { destroy } = ipc_settingsUpdatedEvent.renderer!.handle(async (settings) => {
      handle(settings);
    });
    return destroy;
  },

  /**
   * Subscribe to incremental setting changes from main process
   * This is the primary mechanism for keeping renderer in sync
   */
  onSettingChanged(handle: (updates: SettingUpdate[]) => void) {
    const { destroy } = ipc_settingChangedEvent.renderer!.handle(async ({ updates }) => {
      handle(updates);
    });
    return destroy;
  },

  /**
   * Subscribe to requests to open settings modal
   */
  onOpenSettingsPageRequest(handle: () => void) {
    const { destroy } = ipc_openSettingsModalEvent.renderer!.handle(async () => {
      handle();
    });
    return destroy;
  },

  /**
   * Update multiple settings atomically
   * @example
   * await updateSettings([
   *   { key: "isoPath", value: "/path/to/game.iso" },
   *   { key: "autoUpdateLauncher", value: true },
   * ]);
   */
  async updateSettings(updates: SettingUpdate[]): Promise<void> {
    await ipc_updateSettings.renderer!.trigger({ updates });
  },

  /**
   * Connection management
   */
  async addNewConnection(connection: Omit<StoredConnection, "id">): Promise<void> {
    await ipc_addNewConnection.renderer!.trigger({ connection });
  },

  async editConnection(id: number, connection: Omit<StoredConnection, "id">): Promise<void> {
    await ipc_editConnection.renderer!.trigger({ id, connection });
  },

  async deleteConnection(id: number): Promise<void> {
    await ipc_deleteConnection.renderer!.trigger({ id });
  },
};
