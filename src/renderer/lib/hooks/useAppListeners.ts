/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastListUpdatedEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_slippiStatusChangedEvent,
} from "@broadcast/ipc";
import { ipc_consoleMirrorStatusUpdatedEvent, ipc_discoveredConsolesUpdatedEvent } from "@console/ipc";
import { ipc_dolphinDownloadLogReceivedEvent } from "@dolphin/ipc";
import { ipc_loadProgressUpdatedEvent, ipc_statsPageRequestedEvent } from "@replays/ipc";
import { ipc_settingsUpdatedEvent } from "@settings/ipc";
import {
  ipc_checkValidIso,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
} from "common/ipc";
import { IsoValidity } from "common/types";
import log from "electron-log";
import firebase from "firebase";
import throttle from "lodash/throttle";
import React from "react";

import { useAppInitialization, useAppStore } from "@/lib/hooks/useApp";
import { useConsole } from "@/lib/hooks/useConsole";
import { useReplays } from "@/lib/hooks/useReplays";

import { useAccount } from "./useAccount";
import { useBroadcastListStore } from "./useBroadcastList";
import { useConsoleDiscoveryStore } from "./useConsoleDiscovery";
import { useIsoVerification } from "./useIsoVerification";
import { useNewsFeed } from "./useNewsFeed";
import { useReplayBrowserNavigation } from "./useReplayBrowserList";
import { useSettings } from "./useSettings";

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
};
