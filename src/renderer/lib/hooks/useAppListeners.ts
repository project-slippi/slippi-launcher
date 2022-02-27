/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IsoValidity } from "@common/types";
import firebase from "firebase";
import throttle from "lodash/throttle";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { useAppInitialization, useAppStore } from "@/lib/hooks/useApp";
import { useConsole } from "@/lib/hooks/useConsole";
import { useReplays } from "@/lib/hooks/useReplays";

import { handleDolphinExitCode } from "../utils";
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

const log = console;

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
  const dolphinDownloadLogHandler = React.useCallback(
    (message: string) => {
      log.info(message);
      setLogMessage(message);
    },
    [setLogMessage],
  );
  React.useEffect(() => {
    return window.electron.dolphin.onDolphinDownloadLogMessage(dolphinDownloadLogHandler);
  }, [dolphinDownloadLogHandler]);

  const setSlippiConnectionStatus = useConsole((store) => store.setSlippiConnectionStatus);
  React.useEffect(() => {
    return window.electron.broadcast.onSlippiStatusChanged(setSlippiConnectionStatus);
  }, [setSlippiConnectionStatus]);

  const setDolphinConnectionStatus = useConsole((store) => store.setDolphinConnectionStatus);
  React.useEffect(() => {
    return window.electron.broadcast.onDolphinStatusChanged(setDolphinConnectionStatus);
  }, [setDolphinConnectionStatus]);

  const setBroadcastError = useConsole((store) => store.setBroadcastError);
  React.useEffect(() => {
    return window.electron.broadcast.onBroadcastErrorMessage(setBroadcastError);
  }, [setBroadcastError]);

  const updateProgress = useReplays((store) => store.updateProgress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  React.useEffect(() => {
    return window.electron.replays.onReplayLoadProgressUpdate(throttledUpdateProgress);
  }, [throttledUpdateProgress]);

  const updateSettings = useSettings((store) => store.updateSettings);
  React.useEffect(() => {
    return window.electron.settings.onSettingsUpdated(updateSettings);
  }, [updateSettings]);

  // Listen to when the list of broadcasting users has changed
  const updateBroadcastingList = useBroadcastListStore((store) => store.setItems);
  React.useEffect(() => {
    return window.electron.broadcast.onBroadcastListUpdated(updateBroadcastingList);
  }, [updateBroadcastingList]);

  // Update the discovered console list
  const updateConsoleItems = useConsoleDiscoveryStore((store) => store.updateConsoleItems);
  React.useEffect(() => {
    return window.electron.console.onDiscoveredConsolesUpdated(updateConsoleItems);
  }, [updateConsoleItems]);

  // Update the mirroring console status
  const updateConsoleStatus = useConsoleDiscoveryStore((store) => store.updateConsoleStatus);
  React.useEffect(() => {
    return window.electron.console.onConsoleMirrorStatusUpdated(updateConsoleStatus);
  }, [updateConsoleStatus]);

  // Automatically run ISO verification whenever the isoPath changes
  const isoPath = useSettings((store) => store.settings.isoPath);
  const setIsValidating = useIsoVerification((store) => store.setIsValidating);
  const setIsValid = useIsoVerification((store) => store.setIsValid);
  React.useEffect(() => {
    if (!isoPath) {
      setIsValid(IsoValidity.UNVALIDATED);
      setIsValidating(false);
      return;
    }

    // Start iso validation
    setIsValidating(true);
    window.electron.common
      .checkValidIso(isoPath)
      .then((isoCheckResult) => {
        if (isoCheckResult.path !== isoPath) {
          // The ISO path changed before verification completed
          // so just do nothing.
          return;
        }

        setIsValid(isoCheckResult.valid);
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [isoPath, setIsValid, setIsValidating]);

  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const { goToReplayStatsPage } = useReplayBrowserNavigation();
  const moveToStatsPage = React.useCallback(
    (filePath: string) => {
      clearSelectedFile();
      goToReplayStatsPage(filePath);
    },
    [clearSelectedFile, goToReplayStatsPage],
  );
  React.useEffect(() => {
    return window.electron.replays.onStatsPageRequest(moveToStatsPage);
  }, [moveToStatsPage]);

  const { open } = useSettingsModal();
  React.useEffect(() => {
    return window.electron.settings.onOpenSettingsPageRequest(open);
  }, [open]);

  // Load the news articles once on app load
  const updateNewsFeed = useNewsFeed((store) => store.update);
  React.useEffect(() => {
    updateNewsFeed();
  }, [updateNewsFeed]);

  const setUpdateVersion = useAppStore((store) => store.setUpdateVersion);
  React.useEffect(() => {
    return window.electron.common.onAppUpdateFound(setUpdateVersion);
  }, [setUpdateVersion]);

  const setUpdateDownloadProgress = useAppStore((store) => store.setUpdateDownloadProgress);
  React.useEffect(() => {
    return window.electron.common.onAppUpdateDownloadProgress(setUpdateDownloadProgress);
  }, [setUpdateDownloadProgress]);

  const setUpdateReady = useAppStore((store) => store.setUpdateReady);
  const setIsReady = React.useCallback(() => {
    setUpdateReady(true);
  }, [setUpdateReady]);
  React.useEffect(() => {
    return window.electron.common.onAppUpdateReady(setIsReady);
  }, [setIsReady]);

  // Initialize the replay browser once and refresh on SLP path changes
  const init = useReplays((store) => store.init);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  React.useEffect(() => {
    init(rootSlpPath, extraSlpPaths, true).catch(console.error);
  }, [rootSlpPath, extraSlpPaths, init]);

  const { addToast } = useToasts();
  const consoleMirrorErrorHandler = React.useCallback(
    (message: string) => {
      addToast(message, {
        id: message,
        appearance: "error",
        autoDismiss: true,
      });
    },
    [addToast],
  );
  React.useEffect(() => {
    return window.electron.console.onConsoleMirrorErrorMessage(consoleMirrorErrorHandler);
  }, [consoleMirrorErrorHandler]);

  const [startBroadcast] = useBroadcast();
  React.useEffect(() => {
    return window.electron.broadcast.onBroadcastReconnect((config) => {
      startBroadcast(config).catch(console.error);
    });
  }, [startBroadcast]);

  const [, refreshBroadcasts] = useBroadcastList();
  React.useEffect(() => {
    return window.electron.broadcast.onSpectateReconnect(refreshBroadcasts);
  }, [refreshBroadcasts]);

  const setDolphinOpen = useDolphinStore((store) => store.setDolphinOpen);
  const dolphinClosedHandler = React.useCallback(
    ({ dolphinType, exitCode }) => {
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
    [addToast, setDolphinOpen],
  );
  React.useEffect(() => {
    return window.electron.dolphin.onDolphinClosed(dolphinClosedHandler);
  }, [dolphinClosedHandler]);
};
