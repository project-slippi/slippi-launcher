import { useToasts } from "@/lib/hooks/useToasts";

export const useInstallAppUpdate = () => {
  const { showError } = useToasts();

  const installAppUpdate = async () => {
    try {
      await window.electron.common.installAppUpdate();
    } catch (err) {
      showError(err);
    }
  };

  return () => {
    void installAppUpdate();
  };
};
