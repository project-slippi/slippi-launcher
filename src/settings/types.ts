import type { DolphinLaunchType } from "@dolphin/types";

/**
 * Console connection configuration
 */
export type StoredConnection = {
  id: number;
  ipAddress: string;
  folderPath: string;
  isRealtime: boolean;
  port?: number;
  consoleNick?: string;
  enableAutoSwitcher: boolean;
  obsIP?: string;
  obsPort?: string;
  obsSourceName?: string;
  obsPassword?: string;
  enableRelay: boolean;
  useNicknameFolders: boolean;
};

/**
 * Settings Schema
 * This is the single source of truth for all application settings
 */
export interface SettingsSchema {
  // Path settings
  isoPath: string | null;
  rootSlpPath: string;
  spectateSlpPath: string;
  extraSlpPaths: string[];

  // Behavior settings
  useMonthlySubfolders: boolean;
  enableJukebox: boolean;
  launchMeleeOnPlay: boolean;
  autoUpdateLauncher: boolean;

  // Dolphin settings
  useNetplayBeta: boolean;
  usePlaybackBeta: boolean;

  // Spectate settings
  enableSpectateRemoteControl: boolean;
}

/**
 * Root-level app settings that aren't nested under "settings"
 */
export interface RootSettingsSchema {
  connections: StoredConnection[];
  previousVersion?: string;
  netplayPromotedToStable: boolean;
  playbackPromotedToStable: boolean;
}

/**
 * Application settings structure
 * Combines nested settings and root-level settings
 */
export type AppSettings = {
  settings: SettingsSchema;
} & RootSettingsSchema;

/**
 * Helper type for all possible setting keys (both nested and root level)
 */
export type SettingKey = keyof SettingsSchema | keyof RootSettingsSchema;

/**
 * Helper type to get the value type for a given setting key
 */
export type SettingValue<K extends SettingKey> = K extends keyof SettingsSchema
  ? SettingsSchema[K]
  : K extends keyof RootSettingsSchema
  ? RootSettingsSchema[K]
  : never;

/**
 * Payload for a single setting update
 */
export interface SettingUpdate<K extends SettingKey = SettingKey> {
  key: K;
  value: SettingValue<K>;
}

/**
 * Special update types for complex operations
 */
export interface ConsoleConnectionUpdate {
  type: "add" | "edit" | "delete";
  id?: number;
  connection?: Omit<StoredConnection, "id">;
}

export interface DolphinBetaUpdate {
  dolphinType: DolphinLaunchType;
  useBeta: boolean;
}
