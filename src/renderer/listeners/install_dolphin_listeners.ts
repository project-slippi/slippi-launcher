import { type DolphinService, DolphinEventType, DolphinLaunchType } from "@dolphin/types";

import { handleDolphinExitCode } from "@/lib/dolphin/handle_dolphin_exit_code";
import {
  DolphinStatus,
  setDolphinOpened,
  setDolphinStatus,
  setDolphinVersion,
  updateNetplayDownloadProgress,
} from "@/lib/dolphin/use_dolphin_store";
import type { NotificationService } from "@/services/notification/types";

import { ListenersMessages as Messages } from "./listeners.messages";

export function installDolphinListeners({
  dolphinService,
  notificationService,
}: {
  dolphinService: DolphinService;
  notificationService: NotificationService;
}) {
  const { showError, showWarning } = notificationService;

  dolphinService.onEvent(DolphinEventType.CLOSED, ({ dolphinType, exitCode }) => {
    setDolphinOpened(dolphinType, false);

    // Check if it exited cleanly
    const errMsg = handleDolphinExitCode(exitCode);
    if (errMsg) {
      showError(errMsg);
    }
  });
  dolphinService.onEvent(DolphinEventType.DOWNLOAD_START, (event) => {
    setDolphinStatus(event.dolphinType, DolphinStatus.DOWNLOADING);
  });

  dolphinService.onEvent(DolphinEventType.DOWNLOAD_PROGRESS, (event) => {
    if (event.dolphinType === DolphinLaunchType.NETPLAY) {
      updateNetplayDownloadProgress(event.progress);
    }
  });

  dolphinService.onEvent(DolphinEventType.DOWNLOAD_COMPLETE, (event) => {
    setDolphinStatus(event.dolphinType, DolphinStatus.READY);
    setDolphinVersion(event.dolphinVersion, event.dolphinType);
  });

  dolphinService.onEvent(DolphinEventType.NETWORK_ERROR, (event) => {
    const preludeMessage = !navigator.onLine ? Messages.youAreOffline() : Messages.networkError();
    showWarning(`${preludeMessage} ${Messages.someFunctionalityUnavailable()}`);
    setDolphinStatus(event.dolphinType, DolphinStatus.READY);
  });
}
