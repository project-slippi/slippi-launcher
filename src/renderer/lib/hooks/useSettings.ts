import { DolphinLaunchType } from "@dolphin/types";
import {
  ipc_setAutoUpdateLauncher,
  ipc_setExtraSlpPaths,
  ipc_setIsoPath,
  ipc_setLaunchMeleeOnPlay,
  ipc_setNetplayDolphinPath,
  ipc_setPlaybackDolphinPath,
  ipc_setRootSlpPath,
  ipc_setSpectateSlpPath,
  ipc_setUseMonthlySubfolders,
} from "@settings/ipc";
import { AppSettings } from "@settings/types";
import { ipcRenderer } from "electron";
import { useCallback } from "react";
import create from "zustand";
import { combine } from "zustand/middleware";

const initialState = ipcRenderer.sendSync("getAppSettingsSync") as AppSettings;
console.log("initial state: ", initialState);

export const useSettings = create(
  combine(
    {
      ...initialState,
    },
    (set) => ({
      updateSettings: (settings: AppSettings) => set(() => settings),
    }),
  ),
);

export const useIsoPath = () => {
  const isoPath = useSettings((store) => store.settings.isoPath);
  const setPath = async (isoPath: string | null) => {
    const setResult = await ipc_setIsoPath.renderer!.trigger({ isoPath });
    if (!setResult.result) {
      throw new Error("Error setting ISO path");
    }
  };
  return [isoPath, setPath] as const;
};

export const useRootSlpPath = () => {
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const setReplayDir = async (path: string) => {
    const setResult = await ipc_setRootSlpPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting root SLP path");
    }
  };
  return [rootSlpPath, setReplayDir] as const;
};

export const useMonthlySubfolders = () => {
  const useMonthlySubfolders = useSettings((store) => store.settings.useMonthlySubfolders);
  const setUseMonthlySubfolders = async (toggle: boolean) => {
    const setResult = await ipc_setUseMonthlySubfolders.renderer!.trigger({ toggle });
    if (!setResult.result) {
      throw new Error("Error setting use monthly subfolders");
    }
  };
  return [useMonthlySubfolders, setUseMonthlySubfolders] as const;
};

export const useSpectateSlpPath = () => {
  const spectateSlpPath = useSettings((store) => store.settings.spectateSlpPath);
  const setSpectateDir = async (path: string) => {
    const setResult = await ipc_setSpectateSlpPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting spectate SLP path");
    }
  };
  return [spectateSlpPath, setSpectateDir] as const;
};

export const useExtraSlpPaths = () => {
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  const setExtraSlpDirs = async (paths: string[]) => {
    const setResult = await ipc_setExtraSlpPaths.renderer!.trigger({ paths });
    if (!setResult.result) {
      throw new Error("Error setting extra SLP paths");
    }
  };
  return [extraSlpPaths, setExtraSlpDirs] as const;
};

export const useDolphinPath = (dolphinType: DolphinLaunchType) => {
  const netplayDolphinPath = useSettings((store) => store.settings.netplayDolphinPath);
  const setNetplayPath = async (path: string) => {
    const setResult = await ipc_setNetplayDolphinPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting netplay dolphin path");
    }
  };

  const playbackDolphinPath = useSettings((store) => store.settings.playbackDolphinPath);
  const setDolphinPath = async (path: string) => {
    const setResult = await ipc_setPlaybackDolphinPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting playback dolphin path");
    }
  };

  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY: {
      return [netplayDolphinPath, setNetplayPath] as const;
    }
    case DolphinLaunchType.PLAYBACK: {
      return [playbackDolphinPath, setDolphinPath] as const;
    }
  }
};

export const useLaunchMeleeOnPlay = () => {
  const launchMeleeOnPlay = useSettings((store) => store.settings.launchMeleeOnPlay);
  const setLaunchMelee = async (launchMelee: boolean) => {
    const setResult = await ipc_setLaunchMeleeOnPlay.renderer!.trigger({ launchMelee });
    if (!setResult.result) {
      throw new Error("Error setting launch melee on Play");
    }
  };

  return [launchMeleeOnPlay, setLaunchMelee] as const;
};

export const useAutoUpdateLauncher = () => {
  const autoUpdateLauncher = useSettings((store) => store.settings.autoUpdateLauncher);
  const setAutoUpdateLauncher = useCallback(async (autoUpdateLauncher: boolean) => {
    const setResult = await ipc_setAutoUpdateLauncher.renderer!.trigger({ autoUpdateLauncher });
    if (!setResult.result) {
      throw new Error("Error setting launcher auto updates");
    }
  }, []);

  return [autoUpdateLauncher, setAutoUpdateLauncher] as const;
};
