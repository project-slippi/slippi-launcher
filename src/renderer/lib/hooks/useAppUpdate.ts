import React from "react";

import { useToasts } from "@/lib/hooks/useToasts";

export const useAppUpdate = () => {
  const { showError } = useToasts();

  const checkForAppUpdates = React.useCallback(async () => {
    try {
      await window.electron.common.checkForAppUpdates();
    } catch (err) {
      showError(err);
    }
  }, [showError]);

  const installAppUpdate = React.useCallback(async () => {
    try {
      await window.electron.common.installAppUpdate();
    } catch (err) {
      showError(err);
    }
  }, [showError]);

  return {
    checkForAppUpdates,
    installAppUpdate,
  };
};
