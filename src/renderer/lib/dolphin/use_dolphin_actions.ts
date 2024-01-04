import type { GeckoCode } from "@dolphin/config/geckoCode";
import type { DolphinService, ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/use_toasts";

import { DolphinStatus, setDolphinOpened, useDolphinStore } from "./use_dolphin_store";

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

  const updateDolphin = useCallback(async () => {
    return Promise.all(
      [DolphinLaunchType.NETPLAY, DolphinLaunchType.PLAYBACK].map(async (dolphinType) => {
        if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
          return;
        }
        return dolphinService.downloadDolphin(dolphinType).catch((err) => {
          showError(
            `Failed to install ${dolphinType} Dolphin. Try closing all Dolphin instances and restarting the launcher. Error: ${
              err instanceof Error ? err.message : JSON.stringify(err)
            }`,
          );
        });
      }),
    );
  }, [getInstallStatus, dolphinService, showError]);

  const openConfigureDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
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
        showError("Dolphin is updating. Try again later.");
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
        showError("Dolphin is updating. Try again later.");
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

  const readGeckoCodes = useCallback(
    async (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
        return;
      }
      return await dolphinService.fetchGeckoCodes(dolphinType);
    },
    [dolphinService, getInstallStatus, showError],
  );

  const saveGeckoCodes = useCallback(
    async (dolphinType: DolphinLaunchType, geckoCodes: GeckoCode[]) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
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
    importDolphin,
    updateDolphin,
    readGeckoCodes,
    saveGeckoCodes,
  };
};
