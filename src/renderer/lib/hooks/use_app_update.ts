import React from "react";

import { useToasts } from "@/lib/hooks/use_toasts";

export const useAppUpdate = () => {
  const { showError } = useToasts();

  const checkForAppUpdates = React.useCallback(async () => {
    try {
      const result = await window.electron.common.checkForAppUpdates();
      return result;
    } catch (err) {
      showError(err);
      return null;
    }
  }, [showError]);

  const installAppUpdate = React.useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      return await window.electron.common.installAppUpdate();
    } catch (err) {
      showError(err);
      return { success: false, error: String(err) };
    }
  }, [showError]);

  return {
    checkForAppUpdates,
    installAppUpdate,
  };
};
