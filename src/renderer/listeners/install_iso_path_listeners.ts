import { IsoValidity } from "@common/types";
import log from "electron-log";

import { useIsoVerification } from "@/lib/hooks/use_iso_verification";

export function installIsoPathListeners() {
  window.electron.settings.onSettingChanged((updates) => {
    updates.forEach((update) => {
      if (update.key === "isoPath") {
        void onIsoPathChange(update.value as any);
      }
    });
  });
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
