import { broadcastErrorOccurred, dolphinStatusChanged, slippiStatusChanged } from "@broadcast/ipc";
import { loadProgressUpdated } from "@replays/ipc";
import throttle from "lodash/throttle";

import { useConsole } from "@/store/console";
import { useReplays } from "@/store/replays";

export const useAppListeners = () => {
  const setSlippiConnectionStatus = useConsole((store) => store.setSlippiConnectionStatus);
  const throttledSetSlippiStatus = throttle(setSlippiConnectionStatus, 50);
  slippiStatusChanged.renderer!.useEvent(async ({ status }) => {
    throttledSetSlippiStatus(status);
  }, []);

  const setDolphinConnectionStatus = useConsole((store) => store.setDolphinConnectionStatus);
  const throttledSetDolphinStatus = throttle(setDolphinConnectionStatus, 50);
  dolphinStatusChanged.renderer!.useEvent(async ({ status }) => {
    throttledSetDolphinStatus(status);
  }, []);

  const setBroadcastError = useConsole((store) => store.setBroadcastError);
  broadcastErrorOccurred.renderer!.useEvent(async ({ errorMessage }) => {
    setBroadcastError(errorMessage);
  }, []);

  const updateProgress = useReplays((store) => store.updateProgress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  loadProgressUpdated.renderer!.useEvent(async (progress) => {
    throttledUpdateProgress(progress);
  }, []);
};
