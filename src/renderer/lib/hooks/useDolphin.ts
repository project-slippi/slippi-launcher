import type { ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import { useToasts } from "react-toast-notifications";
import create from "zustand";
import { combine } from "zustand/middleware";

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
  const { addToast } = useToasts();
  const handleError = (err: any) => addToast(err.message ?? JSON.stringify(err), { appearance: "error" });

  const setDolphinOpen = useDolphinStore((store) => store.setDolphinOpen);

  const openConfigureDolphin = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.configureDolphin(dolphinType);
      setDolphinOpen(dolphinType);
    } catch (err) {
      handleError(err);
    }
  };

  const clearDolphinCache = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.clearDolphinCache(dolphinType);
    } catch (err) {
      handleError(err);
    }
  };

  const reinstallDolphin = async (dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.reinstallDolphin(dolphinType);
    } catch (err) {
      handleError(err);
    }
  };

  const launchNetplay = async (bootToCss: boolean) => {
    try {
      await window.electron.dolphin.launchNetplayDolphin({ bootToCss });
      setDolphinOpen(DolphinLaunchType.NETPLAY);
    } catch (err) {
      handleError(err);
    }
  };

  const viewReplays = async (files: ReplayQueueItem[]) => {
    try {
      await window.electron.dolphin.viewSlpReplay(files);
      setDolphinOpen(DolphinLaunchType.PLAYBACK);
    } catch (err) {
      handleError(err);
    }
  };

  const importDolphin = async (toImportDolphinPath: string, dolphinType: DolphinLaunchType) => {
    try {
      await window.electron.dolphin.importDolphinSettings({ toImportDolphinPath, dolphinType });
      addToast(`${dolphinType} Dolphin settings successfully imported`, { appearance: "success" });
    } catch (err) {
      handleError(err);
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
