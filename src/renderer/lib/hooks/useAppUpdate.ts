import { useToasts } from "@/lib/hooks/useToasts";

export const useAppUpdate = () => {
  const { showError } = useToasts();

  const checkForAppUpdates = async () => {
    try {
      await window.electron.common.checkForAppUpdates();
    } catch (err) {
      showError(err);
    }
  };

  const installAppUpdate = async () => {
    try {
      await window.electron.common.installAppUpdate();
    } catch (err) {
      showError(err);
    }
  };

  return {
    checkForAppUpdates,
    installAppUpdate,
  };
};
