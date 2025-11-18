import { IsoValidity } from "@common/types";
import type { SettingKey } from "@settings/types";
import log from "electron-log";

import { useIsoVerification } from "@/lib/hooks/use_iso_verification";
import { useSettingsStore } from "@/lib/hooks/use_settings";

export function installSettingsChangeListeners() {
  window.electron.settings.onSettingChanged((updates) => {
    // Listen for individual settings changes
    updates.forEach((update) => onSettingChange(update.key, update.value));

    // Apply updates to the settings store
    useSettingsStore.getState().applyUpdates(updates);
  });
}

// Enrol listeners for individual settings changes
function onSettingChange(key: SettingKey, value: any) {
  switch (key) {
    case "isoPath":
      void onIsoPathChange(value);
      break;
    default:
      break;
  }
}

let requestId = 0;
async function onIsoPathChange(isoPath: string | null) {
  if (!isoPath) {
    useIsoVerification.getState().setIsValid(IsoValidity.UNVALIDATED);
    useIsoVerification.getState().setIsValidating(false);
    return;
  }

  // Start iso validation
  const currentRequestId = ++requestId;
  try {
    useIsoVerification.getState().setIsValidating(true);
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
    useIsoVerification.getState().setIsValid(isoCheckResult.valid);
  } catch (err) {
    log.error(err);
  } finally {
    useIsoVerification.getState().setIsValidating(false);
  }
}
