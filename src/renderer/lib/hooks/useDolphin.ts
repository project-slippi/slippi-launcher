import {
  ipc_clearDolphinCache,
  ipc_configureDolphin,
  ipc_importDolphinSettings,
  ipc_launchNetplayDolphin,
  ipc_reinstallDolphin,
  ipc_viewSlpReplay,
} from "@dolphin/ipc";
import { DolphinLaunchType, ReplayQueueItem } from "@dolphin/types";
import electronLog from "electron-log";
import { MainEndpointResponse } from "ipc";
import { useToasts } from "react-toast-notifications";
import create from "zustand";
import { combine } from "zustand/middleware";

const log = electronLog.scope("useDolphin");

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
  const setDolphinOpen = useDolphinStore((store) => store.setDolphinOpen);

  const handleResult = <T>(res: MainEndpointResponse<T>, errLog: string): boolean => {
    try {
      if (!res.result) {
        log.error(errLog, res.errors);
        throw new Error(errLog);
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : JSON.stringify(err), {
        appearance: "error",
      });
      return false;
    }
    return true;
  };

  const openConfigureDolphin = async (dolphinType: DolphinLaunchType) => {
    const configureResult = await ipc_configureDolphin.renderer!.trigger({ dolphinType });
    const success = handleResult(configureResult, `Error launching ${dolphinType} Dolphin`);
    if (success) {
      setDolphinOpen(dolphinType);
    }
  };
  const clearDolphinCache = async (dolphinType: DolphinLaunchType) => {
    const clearCacheResult = await ipc_clearDolphinCache.renderer!.trigger({ dolphinType });
    handleResult(clearCacheResult, `Error clearing ${dolphinType} Dolphin cache`);
  };
  const reinstallDolphin = async (dolphinType: DolphinLaunchType) => {
    const reinstallResult = await ipc_reinstallDolphin.renderer!.trigger({ dolphinType });
    handleResult(reinstallResult, `Error reinstalling netplay Dolphin`);
  };
  const launchNetplay = async (bootToCss: boolean) => {
    const launchResult = await ipc_launchNetplayDolphin.renderer!.trigger({ bootToCss });
    const success = handleResult(launchResult, `Error launching netplay Dolphin`);
    if (success) {
      setDolphinOpen(DolphinLaunchType.NETPLAY);
    }
  };

  const viewReplays = async (files: ReplayQueueItem[]) => {
    const viewResult = await ipc_viewSlpReplay.renderer!.trigger({ files });
    const success = handleResult(viewResult, `Error playing file(s): ${files.join(", ")}`);
    if (success) {
      setDolphinOpen(DolphinLaunchType.PLAYBACK);
    }
  };

  const importDolphin = async (toImportDolphinPath: string, dolphinType: DolphinLaunchType) => {
    const importResult = await ipc_importDolphinSettings.renderer!.trigger({ toImportDolphinPath, dolphinType });
    const success = handleResult(importResult, `Error importing ${dolphinType} dolphin settings`);
    if (success) {
      addToast(`${dolphinType} Dolphin settings successfully imported`, { appearance: "success" });
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
