import { ipc_installUpdate } from "common/ipc";
import { useToasts } from "react-toast-notifications";

export const useInstallAppUpdate = () => {
  const { addToast } = useToasts();

  const installAppUpdate = async () => {
    try {
      await ipc_installUpdate.renderer!.trigger({});
    } catch (err) {
      addToast(err.message ?? JSON.stringify(err), {
        appearance: "error",
      });
    }
  };

  return () => {
    void installAppUpdate();
  };
};
