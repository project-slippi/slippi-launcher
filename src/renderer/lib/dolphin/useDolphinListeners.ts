import type {
  DolphinDownloadCompleteEvent,
  DolphinDownloadProgressEvent,
  DolphinNetplayClosedEvent,
  DolphinPlaybackClosedEvent,
  DolphinService,
} from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import { useCallback, useEffect } from "react";

import { useToasts } from "@/lib/hooks/useToasts";

import { handleDolphinExitCode } from "./handleDolphinExitCode";
import { DolphinStatus, setDolphinComplete, setDolphinOpened, updateNetplayDownloadProgress } from "./useDolphinStore";

// Setup listeners for DolphinService
export const useDolphinListeners = (dolphinService: DolphinService) => {
  const { showError } = useToasts();
  const dolphinClosedHandler = useCallback(
    ({ dolphinType, exitCode }: DolphinNetplayClosedEvent | DolphinPlaybackClosedEvent) => {
      setDolphinOpened(dolphinType, false);

      // Check if it exited cleanly
      const errMsg = handleDolphinExitCode(exitCode);
      if (errMsg) {
        showError(errMsg);
      }
    },
    [showError],
  );

  const dolphinProgressHandler = useCallback((event: DolphinDownloadProgressEvent) => {
    if (event.dolphinType === DolphinLaunchType.NETPLAY) {
      updateNetplayDownloadProgress(event.progress);
    }
  }, []);

  const dolphinCompleteHandler = useCallback((event: DolphinDownloadCompleteEvent) => {
    setDolphinComplete(event.dolphinType, DolphinStatus.READY);
  }, []);

  useEffect(() => {
    const subs: Array<() => void> = [];
    subs.push(dolphinService.onEvent(DolphinEventType.CLOSED, dolphinClosedHandler));
    subs.push(dolphinService.onEvent(DolphinEventType.DOWNLOAD_PROGRESS, dolphinProgressHandler));
    subs.push(dolphinService.onEvent(DolphinEventType.DOWNLOAD_COMPLETE, dolphinCompleteHandler));

    return () => {
      subs.forEach((unsub) => unsub());
    };
  }, [dolphinService, dolphinClosedHandler, dolphinProgressHandler, dolphinCompleteHandler]);
};
