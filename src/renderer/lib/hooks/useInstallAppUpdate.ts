import { useToasts } from "@/lib/hooks/useToasts";

export const useInstallAppUpdate = () => {
  const { showError } = useToasts();

  const installAppUpdate = async () => {
    try {
      await window.electron.common.installAppUpdate();
    } catch (err) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = JSON.stringify(err);
      }
      showError(message);
    }
  };

  return () => {
    void installAppUpdate();
  };
};
