import type { BroadcastService } from "@broadcast/types";
import type { ConsoleService } from "@console/types";

import { refreshUserData, useAccount } from "./lib/hooks/use_account";
import { useAppStore } from "./lib/hooks/use_app_store";
import { useBroadcastListStore } from "./lib/hooks/use_broadcast_list";
import { useConsole } from "./lib/hooks/use_console";
import { useConsoleDiscoveryStore } from "./lib/hooks/use_console_discovery";
import { installDolphinListeners } from "./listeners/install_dolphin_listeners";
import { installSettingsChangeListeners } from "./listeners/install_settings_change_listeners";
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

  window.electron.common.onAppUpdateReady(() => {
    useAppStore.getState().setUpdateReady(true);
  });

  window.electron.common.onAppUpdateDownloadProgress((progress) => {
    useAppStore.getState().setUpdateDownloadProgress(progress);
  });

  installDolphinListeners({ dolphinService, notificationService });
  installBroadcastListeners({ broadcastService });
  installConsoleListeners({ consoleService, notificationService });
  installSettingsChangeListeners();
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
