import { IsoValidity } from "@common/types";
import type { ReplayService } from "@replays/types";
import type { SettingKey } from "@settings/types";
import log from "electron-log";

import { useIsoVerification } from "@/lib/hooks/use_iso_verification";
import { getReplayPresenter } from "@/lib/hooks/use_replays";
import { useSettingsStore } from "@/lib/hooks/use_settings";

export function installSettingsChangeListeners({ replayService }: { replayService: ReplayService }) {
  const replayPresenter = getReplayPresenter(replayService);

  // Re-initialize the replay browser whenever the tracked SLP paths change
  const initReplayBrowser = () => {
    const { rootSlpPath, extraSlpPaths } = useSettingsStore.getState().settings;
    void replayPresenter.init(rootSlpPath, extraSlpPaths, true).catch(log.error);
  };
  // Also initialize it once on app startup
  initReplayBrowser();

  // Enroll listeners for individual settings changes
  const onSettingChange = (key: SettingKey, value: any) => {
    switch (key) {
      case "isoPath":
        void onIsoPathChange(value);
        break;
      case "rootSlpPath":
        initReplayBrowser();
        break;
      case "extraSlpPaths":
        initReplayBrowser();
        break;
      default:
        break;
    }
  };

  window.electron.settings.onSettingChanged((updates) => {
    // First apply updates to the settings store
    useSettingsStore.getState().applyUpdates(updates);

    // Then trigger listeners for individual settings changes
    updates.forEach((update) => onSettingChange(update.key, update.value));
  });
}

let requestId = 0;
async function onIsoPathChange(isoPath: string | null) {
  const { setIsValid, setIsValidating } = useIsoVerification.getState();
  if (!isoPath) {
    setIsValid(IsoValidity.UNVALIDATED);
    setIsValidating(false);
    return;
  }

  // Start iso validation
  const currentRequestId = ++requestId;
  try {
    setIsValidating(true);
    const isoCheckResult = await window.electron.common.checkValidIso(isoPath);
    if (requestId !== currentRequestId) {
      // We've got a new request in already, so just do nothing.
      return;
    }

    if (isoCheckResult.path !== isoPath) {
      // The ISO path changed before verification completed
      // so just do nothing.
      return;
    }
    setIsValid(isoCheckResult.valid);
  } catch (err) {
    log.error(err);
  } finally {
    setIsValidating(false);
  }
}
