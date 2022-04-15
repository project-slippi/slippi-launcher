import type { DolphinService, ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/useToasts";

import { DolphinStatus, setDolphinOpened, useDolphinStore } from "./useDolphinStore";

export const useDolphinActions = (dolphinService: DolphinService) => {
  const { showError, showSuccess } = useToasts();
  const netplayStatus = useDolphinStore((store) => store.netplayStatus);
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);

  const getInstallStatus = useCallback(
    (dolphinType: DolphinLaunchType): DolphinStatus => {
      switch (dolphinType) {
        case DolphinLaunchType.NETPLAY:
          return netplayStatus;
        case DolphinLaunchType.PLAYBACK:
          return playbackStatus;
      }
    },
    [netplayStatus, playbackStatus],
  );

  const assertReady = useCallback(
    (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        const msg = "Dolphin is busy. Try again later.";
        showError(msg);
        throw new Error(msg);
      }
    },
    [getInstallStatus, showError],
  );

  const openConfigureDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      assertReady(dolphinType);
      dolphinService
        .configureDolphin(dolphinType)
        .then(() => {
          setDolphinOpened(dolphinType);
        })
        .catch(showError);
    },
    [assertReady, dolphinService, showError],
  );

  const clearDolphinCache = useCallback(
    (dolphinType: DolphinLaunchType) => {
      dolphinService.clearDolphinCache(dolphinType).catch(showError);
    },
    [dolphinService, showError],
  );

  const reinstallDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      dolphinService.reinstallDolphin(dolphinType).catch(showError);
    },
    [dolphinService, showError],
  );

  const launchNetplay = useCallback(
    (bootToCss: boolean) => {
      assertReady(DolphinLaunchType.NETPLAY);
      dolphinService.launchNetplayDolphin({ bootToCss }).catch(showError);
    },
    [assertReady, dolphinService, showError],
  );

  const viewReplays = useCallback(
    (...files: ReplayQueueItem[]) => {
      assertReady(DolphinLaunchType.PLAYBACK);
      dolphinService
        .viewSlpReplay(files)
        .then(() => {
          setDolphinOpened(DolphinLaunchType.PLAYBACK);
        })
        .catch(showError);
    },
    [assertReady, dolphinService, showError],
  );

  const importDolphin = useCallback(
    (toImportDolphinPath: string, dolphinType: DolphinLaunchType) => {
      dolphinService
        .importDolphinSettings({ toImportDolphinPath, dolphinType })
        .then(() => {
          showSuccess(`${dolphinType} Dolphin settings successfully imported`);
        })
        .catch(showError);
    },
    [dolphinService, showError, showSuccess],
  );

  return {
    openConfigureDolphin,
    clearDolphinCache,
    reinstallDolphin,
    launchNetplay,
    viewReplays,
    importDolphin,
  };
};
