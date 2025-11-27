import type { GeckoCode } from "@dolphin/config/gecko_code";
import type { DolphinService, ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import log from "electron-log";
import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/use_toasts";

import { DolphinMessages as Messages } from "./dolphin.messages";
import { DolphinStatus, setDolphinOpened, useDolphinStore } from "./use_dolphin_store";

export const useDolphinActions = (dolphinService: DolphinService) => {
  const { showError } = useToasts();
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

  const updateDolphin = useCallback(async () => {
    return Promise.all(
      [DolphinLaunchType.NETPLAY, DolphinLaunchType.PLAYBACK].map(async (dolphinType) => {
        if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
          return;
        }
        return dolphinService.downloadDolphin(dolphinType).catch((err) => {
          log.error(err);
          const dolphinTypeName =
            dolphinType === DolphinLaunchType.NETPLAY ? Messages.netplayDolphin() : Messages.playbackDolphin();
          showError(Messages.failedToInstallDolphin(dolphinTypeName));
        });
      }),
    );
  }, [getInstallStatus, dolphinService, showError]);

  const openConfigureDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError(Messages.dolphinIsUpdating());
        return;
      }

      dolphinService
        .configureDolphin(dolphinType)
        .then(() => {
          setDolphinOpened(dolphinType);
        })
        .catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const softResetDolphin = useCallback(
    async (dolphinType: DolphinLaunchType) => {
      try {
        await dolphinService.softResetDolphin(dolphinType);
      } catch (err) {
        showError(err);
      }
    },
    [dolphinService, showError],
  );

  const hardResetDolphin = useCallback(
    async (dolphinType: DolphinLaunchType) => {
      try {
        await dolphinService.hardResetDolphin(dolphinType);
      } catch (err) {
        showError(err);
      }
    },
    [dolphinService, showError],
  );

  const launchNetplay = useCallback(
    (bootToCss: boolean) => {
      if (getInstallStatus(DolphinLaunchType.NETPLAY) !== DolphinStatus.READY) {
        showError(Messages.dolphinIsUpdating());
        return;
      }

      dolphinService
        .launchNetplayDolphin({ bootToCss })
        .then(() => {
          setDolphinOpened(DolphinLaunchType.NETPLAY);
        })
        .catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const viewReplays = useCallback(
    (...files: ReplayQueueItem[]) => {
      if (getInstallStatus(DolphinLaunchType.PLAYBACK) !== DolphinStatus.READY) {
        showError(Messages.dolphinIsUpdating());
        return;
      }

      dolphinService
        .viewSlpReplay(files)
        .then(() => {
          setDolphinOpened(DolphinLaunchType.PLAYBACK);
        })
        .catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const readGeckoCodes = useCallback(
    async (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError(Messages.dolphinIsUpdating());
        return;
      }
      return await dolphinService.fetchGeckoCodes(dolphinType);
    },
    [dolphinService, getInstallStatus, showError],
  );

  const saveGeckoCodes = useCallback(
    async (dolphinType: DolphinLaunchType, geckoCodes: GeckoCode[]) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError(Messages.dolphinIsUpdating());
        return;
      }

      return await dolphinService.saveGeckoCodes(dolphinType, geckoCodes);
    },
    [dolphinService, getInstallStatus, showError],
  );

  return {
    openConfigureDolphin,
    softResetDolphin,
    hardResetDolphin,
    launchNetplay,
    viewReplays,
    updateDolphin,
    readGeckoCodes,
    saveGeckoCodes,
  };
};
