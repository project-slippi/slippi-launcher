import { DolphinLaunchType } from "@dolphin/types";
import { unstable_batchedUpdates } from "react-dom";
import create from "zustand";

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

export const setDolphinComplete = (dolphinType: DolphinLaunchType, status: DolphinStatus) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      useDolphinStore.setState({ netplayStatus: status });
      break;
    case DolphinLaunchType.PLAYBACK:
      useDolphinStore.setState({ playbackStatus: status });
      break;
  }
};

export const updateNetplayDownloadProgress = (progress: { current: number; total: number } | null) => {
  unstable_batchedUpdates(() => {
    useDolphinStore.setState({ netplayDownloadProgress: progress });
  });
};
