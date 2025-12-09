import type { ConsoleService } from "@console/types";
import type { SpectateRemoteService } from "@remote/types";
import type { Progress, ReplayService } from "@replays/types";
import throttle from "lodash/throttle";

import { getReplayPresenter } from "@/lib/hooks/use_replays";
import { refreshChatMessages, useChatMessagesStore } from "@/pages/settings/chat_settings/use_chat_messages";

import { clearUserData, refreshUserData, useAccount } from "../lib/hooks/use_account";
import { useAppStore } from "../lib/hooks/use_app_store";
import { useConsoleDiscoveryStore } from "../lib/hooks/use_console_discovery";
import { useSpectateRemoteServerStateStore } from "../lib/hooks/use_spectate_remote_server";
import type { NotificationService } from "../services/notification/types";
import type { Services } from "../services/types";
import { installBroadcastListeners } from "./install_broadcast_listeners";
import { installDolphinListeners } from "./install_dolphin_listeners";
import { installSettingsChangeListeners } from "./install_settings_change_listeners";

export function installAppListeners(services: Services) {
  const {
    authService,
    broadcastService,
    consoleService,
    notificationService,
    slippiBackendService,
    dolphinService,
    spectateRemoteService,
    replayService,
  } = services;

  authService.onUserChange((user) => {
    useAccount.getState().setUser(user);

    // Refresh the play key and chat messages
    if (user) {
      void refreshUserData(slippiBackendService);
      void refreshChatMessages(slippiBackendService, user.uid);
    } else {
      // We've logged out so clear any pending requests for user data.
      clearUserData();
      useChatMessagesStore.getState().resetStore();
    }
  });

  // Subscribe to multi-account changes
  const multiAccountService = authService.getMultiAccountService();
  multiAccountService.onAccountsChange(({ accounts, activeId }) => {
    useAccount.getState().setAccounts(accounts);
    useAccount.getState().setActiveAccountId(activeId);
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

  // Track online/offline status
  window.addEventListener("online", () => {
    useAppStore.getState().setIsOnline(true);
  });
  window.addEventListener("offline", () => {
    useAppStore.getState().setIsOnline(false);
  });

  installDolphinListeners({ dolphinService, notificationService });
  installBroadcastListeners({ broadcastService, authService });
  installConsoleListeners({ consoleService, notificationService });
  installReplayListeners({ replayService });
  installSettingsChangeListeners({ replayService });
  installSpectateListeners({ spectateRemoteService });
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

export function installReplayListeners({ replayService }: { replayService: ReplayService }) {
  const replayPresenter = getReplayPresenter(replayService);

  const updateProgress = (progress: Progress | null) => replayPresenter.updateProgress(progress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  replayService.onReplayLoadProgressUpdate(throttledUpdateProgress);
}
