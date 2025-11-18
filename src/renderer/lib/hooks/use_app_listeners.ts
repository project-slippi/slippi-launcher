/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IsoValidity } from "@common/types";
import type { Progress } from "@replays/types";
import log from "electron-log";
import throttle from "lodash/throttle";
import React, { useRef } from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { ReplayPresenter } from "@/lib/hooks/use_replays";
import { useServices } from "@/services";

import { useDolphinListeners } from "../dolphin/use_dolphin_listeners";
import { useBroadcast } from "./use_broadcast";
import { useBroadcastList } from "./use_broadcast_list";
import { useIsoVerification } from "./use_iso_verification";
import { useReplayBrowserNavigation } from "./use_replay_browser_list";
import { useSettings } from "./use_settings";
import { useSettingsModal } from "./use_settings_modal";
import { useSpectateRemoteServerStateStore } from "./use_spectate_remote_server";

export const useAppListeners = () => {
  // Handle app initalization
  const { broadcastService, dolphinService, spectateRemoteService, replayService } = useServices();
  const replayPresenter = useRef(new ReplayPresenter(replayService));

  useDolphinListeners(dolphinService);

  const updateProgress = (progress: Progress | null) => replayPresenter.current.updateProgress(progress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  React.useEffect(() => {
    return replayService.onReplayLoadProgressUpdate(throttledUpdateProgress);
  }, [throttledUpdateProgress, replayService]);

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

  const updateSpectateRemoteServerState = useSpectateRemoteServerStateStore((store) => store.setState);
  React.useEffect(() => {
    return spectateRemoteService.onSpectateRemoteServerStateChange(updateSpectateRemoteServerState);
  }, [updateSpectateRemoteServerState, spectateRemoteService]);
};
