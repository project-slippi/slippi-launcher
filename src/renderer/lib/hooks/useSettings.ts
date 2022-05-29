import { DolphinLaunchType } from "@dolphin/types";
import type { AppSettings } from "@settings/types";
import { useCallback } from "react";
import create from "zustand";
import { combine } from "zustand/middleware";

const initialState = window.electron.settings.getAppSettingsSync();
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
    await window.electron.settings.setIsoPath(isoPath);
  };
  return [isoPath, setPath] as const;
};

export const useRootSlpPath = () => {
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const setReplayDir = async (path: string) => {
    await window.electron.settings.setRootSlpPath(path);
  };
  return [rootSlpPath, setReplayDir] as const;
};

export const useMonthlySubfolders = () => {
  const useMonthlySubfolders = useSettings((store) => store.settings.useMonthlySubfolders);
  const setUseMonthlySubfolders = async (toggle: boolean) => {
    await window.electron.settings.setUseMonthlySubfolders(toggle);
  };
  return [useMonthlySubfolders, setUseMonthlySubfolders] as const;
};

export const useSpectateSlpPath = () => {
  const spectateSlpPath = useSettings((store) => store.settings.spectateSlpPath);
  const setSpectateDir = async (path: string) => {
    await window.electron.settings.setSpectateSlpPath(path);
  };
  return [spectateSlpPath, setSpectateDir] as const;
};

export const useExtraSlpPaths = () => {
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  const setExtraSlpDirs = async (paths: string[]) => {
    await window.electron.settings.setExtraSlpPaths(paths);
  };
  return [extraSlpPaths, setExtraSlpDirs] as const;
};

export const useDolphinPath = (dolphinType: DolphinLaunchType) => {
  const netplayDolphinPath = useSettings((store) => store.settings.netplayDolphinPath);
  const setNetplayPath = async (path: string) => {
    await window.electron.settings.setNetplayDolphinPath(path);
  };

  const playbackDolphinPath = useSettings((store) => store.settings.playbackDolphinPath);
  const setDolphinPath = async (path: string) => {
    await window.electron.settings.setPlaybackDolphinPath(path);
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
    await window.electron.settings.setLaunchMeleeOnPlay(launchMelee);
  };

  return [launchMeleeOnPlay, setLaunchMelee] as const;
};

export const useAutoUpdateLauncher = () => {
  const autoUpdateLauncher = useSettings((store) => store.settings.autoUpdateLauncher);
  const setAutoUpdateLauncher = useCallback(async (autoUpdateLauncher: boolean) => {
    await window.electron.settings.setAutoUpdateLauncher(autoUpdateLauncher);
  }, []);

  return [autoUpdateLauncher, setAutoUpdateLauncher] as const;
};
