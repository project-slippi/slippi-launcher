/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  broadcastErrorOccurred,
  broadcastListUpdated,
  dolphinStatusChanged,
  slippiStatusChanged,
} from "@broadcast/ipc";
import { consoleMirrorStatusUpdated, discoveredConsolesUpdated } from "@console/ipc";
import { dolphinDownloadLogReceived } from "@dolphin/ipc";
import { loadProgressUpdated, playReplayAndShowStatsPage } from "@replays/ipc";
import { settingsUpdated } from "@settings/ipc";
import { checkValidIso } from "common/ipc";
import log from "electron-log";
import firebase from "firebase";
import throttle from "lodash/throttle";
import React from "react";
import { useHistory } from "react-router-dom";

import { useAppInitialization, useAppStore } from "@/lib/hooks/useApp";
import { useConsole } from "@/store/console";
import { useReplays } from "@/store/replays";

import { useAccount } from "./useAccount";
import { useBroadcastListStore } from "./useBroadcastList";
import { useConsoleDiscoveryStore } from "./useConsoleDiscovery";
import { useIsoVerification } from "./useIsoVerification";
import { useNewsFeed } from "./useNewsFeed";
import { useSettings } from "./useSettings";

export const useAppListeners = () => {
  const history = useHistory();

  // Handle app initalization
  const initialized = useAppStore((store) => store.initialized);
  const initializeApp = useAppInitialization();
  React.useEffect(() => {
    initializeApp();
  }, []);

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
        refreshPlayKey();
      });

      // Unsubscribe on unmount
      return unsubscribe;
    } catch (err) {
      console.warn(err);
    }

    return;
  }, [initialized]);

  const setLogMessage = useAppStore((store) => store.setLogMessage);
  dolphinDownloadLogReceived.renderer!.useEvent(async ({ message }) => {
    log.info(message);
    setLogMessage(message);
  }, []);

  const setSlippiConnectionStatus = useConsole((store) => store.setSlippiConnectionStatus);
  slippiStatusChanged.renderer!.useEvent(async ({ status }) => {
    setSlippiConnectionStatus(status);
  }, []);

  const setDolphinConnectionStatus = useConsole((store) => store.setDolphinConnectionStatus);
  dolphinStatusChanged.renderer!.useEvent(async ({ status }) => {
    setDolphinConnectionStatus(status);
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

  const updateSettings = useSettings((store) => store.updateSettings);
  settingsUpdated.renderer!.useEvent(async (newSettings) => {
    updateSettings(newSettings);
  }, []);

  // Listen to when the list of broadcasting users has changed
  const updateBroadcastingList = useBroadcastListStore((store) => store.setItems);
  broadcastListUpdated.renderer!.useEvent(async ({ items }) => {
    updateBroadcastingList(items);
  }, []);

  // Update the discovered console list
  const updateConsoleItems = useConsoleDiscoveryStore((store) => store.updateConsoleItems);
  discoveredConsolesUpdated.renderer!.handle(async ({ consoles }) => {
    updateConsoleItems(consoles);
  });

  // Update the mirroring console status
  const updateConsoleStatus = useConsoleDiscoveryStore((store) => store.updateConsoleStatus);
  consoleMirrorStatusUpdated.renderer!.handle(async ({ ip, info }) => {
    updateConsoleStatus(ip, info);
  });

  // Automatically run ISO verification whenever the isoPath changes
  const isoPath = useSettings((store) => store.settings.isoPath);
  const setIsValidating = useIsoVerification((store) => store.setIsValidating);
  const setIsValid = useIsoVerification((store) => store.setIsValid);
  React.useEffect(() => {
    if (!isoPath) {
      setIsValid(null);
      setIsValidating(false);
      return;
    }

    // Start iso validation
    setIsValidating(true);
    checkValidIso
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
  }, [isoPath]);

  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const playFiles = useReplays((store) => store.playFiles);
  playReplayAndShowStatsPage.renderer!.handle(async ({ filePath }) => {
    await clearSelectedFile();
    await playFiles([{ path: filePath }]);

    // TODO: Don't use a hard-coded path
    history.push(`/main/replays/${filePath}`);
  });

  // Load the news articles once on app load
  const updateNewsFeed = useNewsFeed((store) => store.update);
  React.useEffect(() => {
    updateNewsFeed();
  }, []);
};
