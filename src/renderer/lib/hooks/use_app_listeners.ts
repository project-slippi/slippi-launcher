/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IsoValidity } from "@common/types";
import type { Progress } from "@replays/types";
import log from "electron-log";
import throttle from "lodash/throttle";
import React, { useRef } from "react";

import { useAppInitialization, useAppStore } from "@/lib/hooks/use_app";
import { useConsole } from "@/lib/hooks/use_console";
import { ReplayPresenter } from "@/lib/hooks/use_replays";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { useDolphinListeners } from "../dolphin/use_dolphin_listeners";
import { useAccount, useUserData } from "./use_account";
import { useBroadcast } from "./use_broadcast";
import { useBroadcastList, useBroadcastListStore } from "./use_broadcast_list";
import { useConsoleDiscoveryStore } from "./use_console_discovery";
import { useIsoVerification } from "./use_iso_verification";
import { useRemoteServerStateStore } from "./use_remote_server";
import { useReplayBrowserNavigation } from "./use_replay_browser_list";
import { useSettings } from "./use_settings";
import { useSettingsModal } from "./use_settings_modal";

export const useAppListeners = () => {
  // Handle app initalization
  const { authService, broadcastService, consoleService, dolphinService, remoteService, replayService } = useServices();
  const replayPresenter = useRef(new ReplayPresenter(replayService));
  const initialized = useAppStore((store) => store.initialized);
  const initializeApp = useAppInitialization();
  React.useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  useDolphinListeners(dolphinService);

  // Subscribe to user auth changes to keep store up to date
  const setUser = useAccount((store) => store.setUser);
  const refreshUserData = useUserData();
  React.useEffect(() => {
    // Only start subscribing to user change events after we've finished initializing
    if (!initialized) {
      return;
    }

    try {
      const unsubscribe = authService.onUserChange((user) => {
        setUser(user);

        // Refresh the play key
        void refreshUserData();
      });

      // Unsubscribe on unmount
      return unsubscribe;
    } catch (err) {
      console.warn(err);
    }

    return;
  }, [initialized, refreshUserData, setUser, authService]);

  const setSlippiConnectionStatus = useConsole((store) => store.setSlippiConnectionStatus);
  React.useEffect(() => {
    return broadcastService.onSlippiStatusChanged(setSlippiConnectionStatus);
  }, [setSlippiConnectionStatus, broadcastService]);

  const setDolphinConnectionStatus = useConsole((store) => store.setDolphinConnectionStatus);
  React.useEffect(() => {
    return broadcastService.onDolphinStatusChanged(setDolphinConnectionStatus);
  }, [setDolphinConnectionStatus, broadcastService]);

  const setBroadcastError = useConsole((store) => store.setBroadcastError);
  React.useEffect(() => {
    return broadcastService.onBroadcastErrorMessage(setBroadcastError);
  }, [setBroadcastError, broadcastService]);

  const updateProgress = (progress: Progress | null) => replayPresenter.current.updateProgress(progress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  React.useEffect(() => {
    return replayService.onReplayLoadProgressUpdate(throttledUpdateProgress);
  }, [throttledUpdateProgress, replayService]);

  const updateSettings = useSettings((store) => store.updateSettings);
  React.useEffect(() => {
    return window.electron.settings.onSettingsUpdated(updateSettings);
  }, [updateSettings]);

  // Listen to when the list of broadcasting users has changed
  const updateBroadcastingList = useBroadcastListStore((store) => store.setItems);
  React.useEffect(() => {
    return broadcastService.onBroadcastListUpdated(updateBroadcastingList);
  }, [updateBroadcastingList, broadcastService]);

  // Update the discovered console list
  const updateConsoleItems = useConsoleDiscoveryStore((store) => store.updateConsoleItems);
  React.useEffect(() => {
    return consoleService.onDiscoveredConsolesUpdated(updateConsoleItems);
  }, [updateConsoleItems, consoleService]);

  // Update the mirroring console status
  const updateConsoleStatus = useConsoleDiscoveryStore((store) => store.updateConsoleStatus);
  React.useEffect(() => {
    return consoleService.onConsoleMirrorStatusUpdated(updateConsoleStatus);
  }, [updateConsoleStatus, consoleService]);

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
      .catch(log.error)
      .finally(() => {
        setIsValidating(false);
      });
  }, [isoPath, setIsValid, setIsValidating]);

  const { goToReplayStatsPage } = useReplayBrowserNavigation();
  const moveToStatsPage = React.useCallback(
    (filePath: string) => {
      replayPresenter.current.clearSelectedFile();
      goToReplayStatsPage(filePath);
    },
    [goToReplayStatsPage],
  );
  React.useEffect(() => {
    return replayService.onStatsPageRequest(moveToStatsPage);
  }, [moveToStatsPage, replayService]);

  const { open } = useSettingsModal();
  React.useEffect(() => {
    return window.electron.settings.onOpenSettingsPageRequest(open);
  }, [open]);

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
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  React.useEffect(() => {
    replayPresenter.current.init(rootSlpPath, extraSlpPaths, true).catch(console.error);
  }, [rootSlpPath, extraSlpPaths]);

  const { showError } = useToasts();
  React.useEffect(() => {
    return consoleService.onConsoleMirrorErrorMessage(showError);
  }, [showError, consoleService]);

  const [startBroadcast] = useBroadcast();
  React.useEffect(() => {
    return broadcastService.onBroadcastReconnect((config) => {
      startBroadcast(config).catch(console.error);
    });
  }, [startBroadcast, broadcastService]);

  const [, connect] = useBroadcastList();
  React.useEffect(() => {
    return broadcastService.onSpectateReconnect(connect);
  }, [connect, broadcastService]);

  const updateRemoteServerState = useRemoteServerStateStore((store) => store.setState);
  React.useEffect(() => {
    return remoteService.onState(updateRemoteServerState);
  }, [updateRemoteServerState, remoteService]);
};
