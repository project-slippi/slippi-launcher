import type { ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useToasts } from "@/lib/hooks/useToasts";

export const useDolphinStore = create(
  combine(
    {
      netplayDolphinOpen: false,
      playbackDolphinOpen: false,
    },
    (set) => ({
      setDolphinOpen: (dolphinType: DolphinLaunchType, val = true) => {
        if (dolphinType === DolphinLaunchType.NETPLAY) {
          set({ netplayDolphinOpen: val });
        } else {
          set({ playbackDolphinOpen: val });
        }
      },
    }),
  ),
);

export const useDolphin = () => {
  const { showError, showSuccess } = useToasts();

  const setDolphinOpen = useDolphinStore((store) => store.setDolphinOpen);

  const openConfigureDolphin = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.configureDolphin(dolphinType);
      setDolphinOpen(dolphinType);
    } catch (err) {
      showError(err);
    }
  };

  const clearDolphinCache = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.clearDolphinCache(dolphinType);
    } catch (err) {
      showError(err);
    }
  };

  const reinstallDolphin = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.reinstallDolphin(dolphinType);
    } catch (err) {
      showError(err);
    }
  };

  const launchNetplay = async (bootToCss: boolean) => {
    try {
      await window.electron.dolphin.launchNetplayDolphin({ bootToCss });
      setDolphinOpen(DolphinLaunchType.NETPLAY);
    } catch (err) {
      showError(err);
    }
  };

  const viewReplays = async (files: ReplayQueueItem[]) => {
    try {
      await window.electron.dolphin.viewSlpReplay(files);
      setDolphinOpen(DolphinLaunchType.PLAYBACK);
    } catch (err) {
      showError(err);
    }
  };

  const importDolphin = async (toImportDolphinPath: string, dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.importDolphinSettings({ toImportDolphinPath, dolphinType });
      showSuccess(`${dolphinType} Dolphin settings successfully imported`);
    } catch (err) {
      showError(err);
    }
  };

  return {
    openConfigureDolphin: (dolphinType: DolphinLaunchType) => void openConfigureDolphin(dolphinType),
    clearDolphinCache: (dolphinType: DolphinLaunchType) => void clearDolphinCache(dolphinType),
    reinstallDolphin,
    launchNetplay: (bootToCss: boolean) => void launchNetplay(bootToCss),
    viewReplays: (files: ReplayQueueItem[]) => void viewReplays(files),
    importDolphin: (importPath: string, dolphinType: DolphinLaunchType) => void importDolphin(importPath, dolphinType),
  };
};
