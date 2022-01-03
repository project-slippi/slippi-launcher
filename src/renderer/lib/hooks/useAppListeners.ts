/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastListUpdatedEvent,
  ipc_broadcastReconnect,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
  ipc_spectateReconnect,
} from "@broadcast/ipc";
import {
  ipc_consoleMirrorErrorMessageEvent,
  ipc_consoleMirrorStatusUpdatedEvent,
  ipc_discoveredConsolesUpdatedEvent,
} from "@console/ipc";
import { ipc_dolphinClosedEvent, ipc_dolphinDownloadLogReceivedEvent } from "@dolphin/ipc";
import { ipc_loadProgressUpdatedEvent, ipc_statsPageRequestedEvent } from "@replays/ipc";
import { ipc_openSettingsModalEvent, ipc_settingsUpdatedEvent } from "@settings/ipc";
import { isLinux, isWindows } from "common/constants";
import {
  ipc_checkValidIso,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
} from "common/ipc";
import { IsoValidity } from "common/types";
import electronLog from "electron-log";
import firebase from "firebase";
import throttle from "lodash/throttle";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { useAppInitialization, useAppStore } from "@/lib/hooks/useApp";
import { useConsole } from "@/lib/hooks/useConsole";
import { useReplays } from "@/lib/hooks/useReplays";

import { useAccount } from "./useAccount";
import { useBroadcast } from "./useBroadcast";
import { useBroadcastList, useBroadcastListStore } from "./useBroadcastList";
import { useConsoleDiscoveryStore } from "./useConsoleDiscovery";
import { useDolphinStore } from "./useDolphin";
import { useIsoVerification } from "./useIsoVerification";
import { useNewsFeed } from "./useNewsFeed";
import { useReplayBrowserNavigation } from "./useReplayBrowserList";
import { useSettings } from "./useSettings";
import { useSettingsModal } from "./useSettingsModal";

const log = electronLog.scope("useAppListeners");

export const useAppListeners = () => {
  // Handle app initalization
  const initialized = useAppStore((store) => store.initialized);
  const initializeApp = useAppInitialization();
  React.useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  // Subscribe to user auth changes to keep store up to date
  const setUser = useAccount((store) => store.setUser);
  const refreshPlayKey = useAccount((store) => store.refreshPlayKey);
  React.useEffect(() => {
    // Only start subscribing to user change events after we've finished initializing
    if (!initialized) {
      return;
    }

    try {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        // Update the user
        setUser(user);

        // Refresh the play key
        void refreshPlayKey();
      });

      // Unsubscribe on unmount
      return unsubscribe;
    } catch (err) {
      console.warn(err);
    }

    return;
  }, [initialized, refreshPlayKey, setUser]);

  const setLogMessage = useAppStore((store) => store.setLogMessage);
  ipc_dolphinDownloadLogReceivedEvent.renderer!.useEvent(async ({ message }) => {
    log.info(message);
    setLogMessage(message);
  }, []);

  const setSlippiConnectionStatus = useConsole((store) => store.setSlippiConnectionStatus);
  ipc_slippiStatusChangedEvent.renderer!.useEvent(async ({ status }) => {
    setSlippiConnectionStatus(status);
  }, []);

  const setDolphinConnectionStatus = useConsole((store) => store.setDolphinConnectionStatus);
  ipc_dolphinStatusChangedEvent.renderer!.useEvent(async ({ status }) => {
    setDolphinConnectionStatus(status);
  }, []);

  const setBroadcastError = useConsole((store) => store.setBroadcastError);
  ipc_broadcastErrorOccurredEvent.renderer!.useEvent(async ({ errorMessage }) => {
    setBroadcastError(errorMessage);
  }, []);

  const updateProgress = useReplays((store) => store.updateProgress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  ipc_loadProgressUpdatedEvent.renderer!.useEvent(async (progress) => {
    throttledUpdateProgress(progress);
  }, []);

  const updateSettings = useSettings((store) => store.updateSettings);
  ipc_settingsUpdatedEvent.renderer!.useEvent(async (newSettings) => {
    updateSettings(newSettings);
  }, []);

  // Listen to when the list of broadcasting users has changed
  const updateBroadcastingList = useBroadcastListStore((store) => store.setItems);
  ipc_broadcastListUpdatedEvent.renderer!.useEvent(async ({ items }) => {
    updateBroadcastingList(items);
  }, []);

  // Update the discovered console list
  const updateConsoleItems = useConsoleDiscoveryStore((store) => store.updateConsoleItems);
  ipc_discoveredConsolesUpdatedEvent.renderer!.useEvent(async ({ consoles }) => {
    updateConsoleItems(consoles);
  }, []);

  // Update the mirroring console status
  const updateConsoleStatus = useConsoleDiscoveryStore((store) => store.updateConsoleStatus);
  ipc_consoleMirrorStatusUpdatedEvent.renderer!.useEvent(async ({ ip, info }) => {
    updateConsoleStatus(ip, info);
  }, []);

  // Automatically run ISO verification whenever the isoPath changes
  const isoPath = useSettings((store) => store.settings.isoPath);
  const setIsValidating = useIsoVerification((store) => store.setIsValidating);
  const setIsValid = useIsoVerification((store) => store.setIsValid);
  React.useEffect(() => {
    if (!isoPath) {
      setIsValid(IsoValidity.INVALID);
      setIsValidating(false);
      return;
    }

    // Start iso validation
    setIsValidating(true);
    ipc_checkValidIso
      .renderer!.trigger({ path: isoPath })
      .then((isoCheckResult) => {
        if (!isoCheckResult.result) {
          console.warn(`Error checking iso validation: ${isoPath}`, isoCheckResult.errors);
          return;
        }

        if (isoCheckResult.result.path !== isoPath) {
          // The ISO path changed before verification completed
          // so just do nothing.
          return;
        }

        setIsValid(isoCheckResult.result.valid);
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [isoPath, setIsValid, setIsValidating]);

  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const { goToReplayStatsPage } = useReplayBrowserNavigation();
  ipc_statsPageRequestedEvent.renderer!.useEvent(async ({ filePath }) => {
    clearSelectedFile();
    goToReplayStatsPage(filePath);
  }, []);

  const { open } = useSettingsModal();
  ipc_openSettingsModalEvent.renderer!.useEvent(async () => {
    open();
  }, []);

  // Load the news articles once on app load
  const updateNewsFeed = useNewsFeed((store) => store.update);
  React.useEffect(() => {
    updateNewsFeed();
  }, [updateNewsFeed]);

  const setUpdateVersion = useAppStore((store) => store.setUpdateVersion);
  ipc_launcherUpdateFoundEvent.renderer!.useEvent(async ({ version }) => {
    setUpdateVersion(version);
  }, []);

  const setUpdateDownloadProgress = useAppStore((store) => store.setUpdateDownloadProgress);
  ipc_launcherUpdateDownloadingEvent.renderer!.useEvent(async ({ progressPercent }) => {
    setUpdateDownloadProgress(progressPercent);
  }, []);

  const setUpdateReady = useAppStore((store) => store.setUpdateReady);
  ipc_launcherUpdateReadyEvent.renderer!.useEvent(async () => {
    setUpdateReady(true);
  }, []);

  // Initialize the replay browser once and refresh on SLP path changes
  const init = useReplays((store) => store.init);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  React.useEffect(() => {
    init(rootSlpPath, extraSlpPaths, true).catch(console.error);
  }, [rootSlpPath, extraSlpPaths, init]);

  const { addToast } = useToasts();
  ipc_consoleMirrorErrorMessageEvent.renderer!.useEvent(async ({ message }) => {
    addToast(message, {
      id: message,
      appearance: "error",
      autoDismiss: true,
    });
  }, []);

  const [startBroadcast] = useBroadcast();
  ipc_broadcastReconnect.renderer!.useEvent(
    async ({ config }) => {
      startBroadcast(config).catch(log.error);
    },
    [startBroadcast],
  );

  const [, refreshBroadcasts] = useBroadcastList();
  ipc_spectateReconnect.renderer!.useEvent(async () => {
    refreshBroadcasts();
  }, [refreshBroadcasts]);

  const setDolphinOpen = useDolphinStore((store) => store.setDolphinOpen);
  ipc_dolphinClosedEvent.renderer!.useEvent(
    async ({ dolphinType, exitCode }) => {
      setDolphinOpen(dolphinType, false);

      // Check if it exited cleanly
      const errMsg = handleDolphinExitCode(exitCode);
      if (errMsg) {
        addToast(errMsg, {
          id: errMsg,
          appearance: "error",
          autoDismiss: false,
        });
      }
    },
    [setDolphinOpen],
  );
};

const handleDolphinExitCode = (exitCode: number | null) => {
  if (exitCode === null || exitCode === 0) {
    return null;
  }

  // Dolphin returns 3 when selecting Update in game on Windows
  if (exitCode === 3 && isWindows) {
    return null;
  }

  if (exitCode === 0xc0000135 || exitCode === 0xc0000409) {
    return `Required DLLs for launching Dolphin are missing. Check the Help section in the settings page to fix this issue.`;
  }

  if (exitCode === 0x7f && isLinux) {
    return `Required libraries for launching Dolphin may be missing. Check the Help section in the settings page for guidance. Post in the Slippi Discord's linux-support channel for further assistance if needed.`;
  }

  return `Dolphin exited with error code: 0x${exitCode.toString(16)}.
    Please screenshot this and post it in a support channel in the Slippi Discord for assistance.`;
};
