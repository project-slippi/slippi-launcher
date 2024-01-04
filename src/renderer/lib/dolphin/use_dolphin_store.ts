import { DolphinLaunchType } from "@dolphin/types";
import { unstable_batchedUpdates } from "react-dom";
import { create } from "zustand";

export enum DolphinStatus {
  UNKNOWN = "UNKNOWN",
  READY = "READY",
  DOWNLOADING = "DOWNLOADING",
}

export const useDolphinStore = create(() => ({
  netplayStatus: DolphinStatus.UNKNOWN,
  playbackStatus: DolphinStatus.UNKNOWN,
  netplayOpened: false,
  playbackOpened: false,
  netplayDownloadProgress: null as { current: number; total: number } | null,
  netplayDolphinVersion: null as string | null,
  playbackDolphinVersion: null as string | null,
}));

export const setDolphinOpened = (dolphinType: DolphinLaunchType, isOpened = true) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      useDolphinStore.setState({ netplayOpened: isOpened });
      break;
    case DolphinLaunchType.PLAYBACK:
      useDolphinStore.setState({ playbackOpened: isOpened });
      break;
  }
};

export const setDolphinStatus = (dolphinType: DolphinLaunchType, status: DolphinStatus) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      useDolphinStore.setState({ netplayStatus: status });
      break;
    case DolphinLaunchType.PLAYBACK:
      useDolphinStore.setState({ playbackStatus: status });
      break;
  }
};

export const setDolphinVersion = (dolphinVersion: string | null, dolphinType: DolphinLaunchType) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      useDolphinStore.setState({ netplayDolphinVersion: dolphinVersion });
      break;
    case DolphinLaunchType.PLAYBACK:
      useDolphinStore.setState({ playbackDolphinVersion: dolphinVersion });
      break;
  }
};

export const updateNetplayDownloadProgress = (progress: { current: number; total: number } | null) => {
  unstable_batchedUpdates(() => {
    useDolphinStore.setState({ netplayDownloadProgress: progress });
  });
};
