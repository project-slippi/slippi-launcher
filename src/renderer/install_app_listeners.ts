import type { BroadcastService } from "@broadcast/types";
import type { ConsoleService } from "@console/types";
import { type DolphinService, DolphinEventType, DolphinLaunchType } from "@dolphin/types";

import { handleDolphinExitCode } from "./lib/dolphin/handle_dolphin_exit_code";
import {
  DolphinStatus,
  setDolphinOpened,
  setDolphinStatus,
  setDolphinVersion,
  updateNetplayDownloadProgress,
} from "./lib/dolphin/use_dolphin_store";
import { refreshUserData, useAccount } from "./lib/hooks/use_account";
import { useAppStore } from "./lib/hooks/use_app_store";
import { useBroadcastListStore } from "./lib/hooks/use_broadcast_list";
import { useConsole } from "./lib/hooks/use_console";
import { useConsoleDiscoveryStore } from "./lib/hooks/use_console_discovery";
import { useSettingsStore } from "./lib/hooks/use_settings";
import type { NotificationService } from "./services/notification/types";
import type { Services } from "./services/types";

export function installAppListeners(services: Services) {
  const { authService, broadcastService, consoleService, notificationService, slippiBackendService, dolphinService } =
    services;

  authService.onUserChange((user) => {
    useAccount.getState().setUser(user);

    // Refresh the play key
    if (user) {
      void refreshUserData(slippiBackendService);
    }
  });

  // Subscribe to incremental setting changes to keep settings state in sync with main
  window.electron.settings.onSettingChanged((updates) => {
    useSettingsStore.getState().applyUpdates(updates);
  });

  window.electron.common.onAppUpdateReady(() => {
    useAppStore.getState().setUpdateReady(true);
  });

  window.electron.common.onAppUpdateDownloadProgress((progress) => {
    useAppStore.getState().setUpdateDownloadProgress(progress);
  });

  installDolphinListeners({ dolphinService, notificationService });
  installBroadcastListeners({ broadcastService });
  installConsoleListeners({ consoleService, notificationService });
}

function installBroadcastListeners({ broadcastService }: { broadcastService: BroadcastService }) {
  broadcastService.onSlippiStatusChanged((status) => {
    useConsole.getState().setSlippiConnectionStatus(status);
  });

  broadcastService.onDolphinStatusChanged((status) => {
    useConsole.getState().setDolphinConnectionStatus(status);
  });

  broadcastService.onBroadcastErrorMessage((error) => {
    useConsole.getState().setBroadcastError(error);
  });

  // Listen to when the list of broadcasting users has changed
  broadcastService.onBroadcastListUpdated((items) => {
    useBroadcastListStore.getState().setItems(items);
  });
}

function installConsoleListeners(services: {
  consoleService: ConsoleService;
  notificationService: NotificationService;
}) {
  const { consoleService, notificationService } = services;
  // Update the discovered console list
  consoleService.onDiscoveredConsolesUpdated((consoles) => {
    useConsoleDiscoveryStore.getState().updateConsoleItems(consoles);
  });

  // Update the mirroring console status
  consoleService.onConsoleMirrorStatusUpdated((status) => {
    useConsoleDiscoveryStore.getState().updateConsoleStatus(status);
  });

  consoleService.onConsoleMirrorErrorMessage((message) => {
    notificationService.showError(message);
  });
}

function installDolphinListeners({
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

  dolphinService.onEvent(DolphinEventType.OFFLINE, (event) => {
    showWarning("You seem to be offline, some functionality of the Launcher and Dolphin will be unavailable.");
    setDolphinStatus(event.dolphinType, DolphinStatus.READY);
  });
}
