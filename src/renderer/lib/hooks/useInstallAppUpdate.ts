import { ipc_installUpdate } from "common/ipc";
import { useCallback } from "react";
import { useToasts } from "react-toast-notifications";

export const useInstallAppUpdate = () => {
  const { addToast } = useToasts();

  const installAppUpdate = useCallback(async () => {
    try {
      await ipc_installUpdate.renderer!.trigger({});
    } catch (err) {
      addToast(err.message ?? JSON.stringify(err), {
        appearance: "error",
      });
    }
  }, [addToast]);

  return () => {
    void installAppUpdate();
  };
};
