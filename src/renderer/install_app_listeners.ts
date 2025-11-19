import type { BroadcastService } from "@broadcast/types";
import type { ConsoleService } from "@console/types";
import type { SpectateRemoteService } from "@remote/types";

import { clearUserData, refreshUserData, useAccount } from "./lib/hooks/use_account";
import { useAppStore } from "./lib/hooks/use_app_store";
import { useBroadcastListStore } from "./lib/hooks/use_broadcast_list";
import { useConsole } from "./lib/hooks/use_console";
import { useConsoleDiscoveryStore } from "./lib/hooks/use_console_discovery";
import { useSpectateRemoteServerStateStore } from "./lib/hooks/use_spectate_remote_server";
import { installDolphinListeners } from "./listeners/install_dolphin_listeners";
import { installSettingsChangeListeners } from "./listeners/install_settings_change_listeners";
import type { NotificationService } from "./services/notification/types";
import type { Services } from "./services/types";

export function installAppListeners(services: Services) {
  const {
    authService,
    broadcastService,
    consoleService,
    notificationService,
    slippiBackendService,
    dolphinService,
    spectateRemoteService,
  } = services;

  authService.onUserChange((user) => {
    useAccount.getState().setUser(user);

    // Refresh the play key
    if (user) {
      void refreshUserData(slippiBackendService);
    } else {
      // We've logged out so clear any pending requests for user data.
      clearUserData();
    }
  });

  window.electron.common.onAppUpdateReady(() => {
    useAppStore.getState().setUpdateReady(true);
  });

  window.electron.common.onAppUpdateDownloadProgress((progress) => {
    useAppStore.getState().setUpdateDownloadProgress(progress);
  });

  window.electron.common.onAppUpdateFound((version) => {
    useAppStore.getState().setUpdateVersion(version);
  });

  installDolphinListeners({ dolphinService, notificationService });
  installBroadcastListeners({ broadcastService });
  installConsoleListeners({ consoleService, notificationService });
  installSettingsChangeListeners();
  installSpectateListeners({ spectateRemoteService });
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

function installSpectateListeners({ spectateRemoteService }: { spectateRemoteService: SpectateRemoteService }) {
  spectateRemoteService.onSpectateRemoteServerStateChange((state) =>
    useSpectateRemoteServerStateStore.getState().setState(state),
  );
}
