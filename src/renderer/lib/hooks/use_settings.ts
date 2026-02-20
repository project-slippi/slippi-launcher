import { DolphinLaunchType } from "@dolphin/types";
import type { SettingKey, SettingsSchema } from "@settings/types";
import { produce } from "immer";
import { useCallback } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

const initialState = window.electron.settings.getAppSettingsSync();
console.log("initial state: ", initialState);

/**
 * NEW: Settings store with Immer for structural sharing
 * This prevents unnecessary re-renders by preserving object references when values don't change
 */
export const useSettingsStore = create(
  combine(
    {
      settings: initialState.settings as SettingsSchema,
      connections: initialState.connections,
      previousVersion: initialState.previousVersion,
      netplayPromotedToStable: initialState.netplayPromotedToStable,
      playbackPromotedToStable: initialState.playbackPromotedToStable,
    },
    (set) => ({
      /**
       * Apply partial updates using Immer for structural sharing
       * Only updates references for values that actually changed
       */
      applyUpdates: (updates: Array<{ key: SettingKey; value: any }>) =>
        set((state) => {
          return produce(state, (draft) => {
            for (const { key, value } of updates) {
              // Check if this is a nested setting or root-level setting
              if (key in draft.settings) {
                (draft.settings as any)[key] = value;
              } else {
                (draft as any)[key] = value;
              }
            }
          });
        }),
    }),
  ),
);

// LEGACY: Keep old useSettings export for backward compatibility
export const useSettings = useSettingsStore;

/**
 * NEW: Generic hook for any setting with granular reactivity
 * Only re-renders when the specific setting changes
 *
 * @example
 * const [isoPath, setIsoPath] = useSetting("isoPath");
 * const [autoUpdate, setAutoUpdate] = useSetting("autoUpdateLauncher");
 */
export function useSetting<K extends keyof SettingsSchema>(
  key: K,
): [SettingsSchema[K], (value: SettingsSchema[K]) => Promise<void>] {
  // Only subscribes to this specific setting
  const value = useSettingsStore((state) => state.settings[key]);

  const setValue = useCallback(
    async (newValue: SettingsSchema[K]) => {
      // Type assertion needed due to complex conditional type in updateSetting
      await window.electron.settings.updateSettings([{ key, value: newValue }]);
    },
    [key],
  );

  return [value, setValue];
}

export const useIsoPath = () => useSetting("isoPath");

export const useEnableSpectateRemoteControl = () => useSetting("enableSpectateRemoteControl");

export const useSpectateRemoteControlPort = () => useSetting("spectateRemoteControlPort");

export const useRootSlpPath = () => useSetting("rootSlpPath");

export const useEnableNetplayReplays = () => useSetting("enableNetplayReplays");

export const useEnableMonthlySubfolders = () => useSetting("useMonthlySubfolders");

export const useEnableJukebox = () => useSetting("enableJukebox");

export const useSpectateSlpPath = () => useSetting("spectateSlpPath");

export const useExtraSlpPaths = () => useSetting("extraSlpPaths");

export const useLaunchMeleeOnPlay = () => useSetting("launchMeleeOnPlay");

export const useAutoUpdateLauncher = () => useSetting("autoUpdateLauncher");

export const useDolphinBeta = (dolphinType: DolphinLaunchType) => {
  const netplayBeta = useSettingsStore((state) => state.settings.useNetplayBeta);
  const playbackBeta = useSettingsStore((state) => state.settings.usePlaybackBeta);

  const setDolphinBeta = useCallback(
    async (useBeta: boolean) => {
      const key = dolphinType === DolphinLaunchType.NETPLAY ? "useNetplayBeta" : "usePlaybackBeta";
      await window.electron.settings.updateSettings([{ key, value: useBeta }]);
    },
    [dolphinType],
  );

  const useBeta = dolphinType === DolphinLaunchType.NETPLAY ? netplayBeta : playbackBeta;
  return [useBeta, setDolphinBeta] as const;
};
