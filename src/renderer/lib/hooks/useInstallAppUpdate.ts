import { useToasts } from "react-toast-notifications";

export const useInstallAppUpdate = () => {
  const { addToast } = useToasts();

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
      addToast(message, { appearance: "error" });
    }
  };

  return () => {
    void installAppUpdate();
  };
};
