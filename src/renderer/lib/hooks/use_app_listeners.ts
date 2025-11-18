/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Progress } from "@replays/types";
import throttle from "lodash/throttle";
import React, { useRef } from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { ReplayPresenter } from "@/lib/hooks/use_replays";
import { useServices } from "@/services";

import { useBroadcast } from "./use_broadcast";
import { useBroadcastList } from "./use_broadcast_list";
import { useReplayBrowserNavigation } from "./use_replay_browser_list";
import { useSettings } from "./use_settings";
import { useSettingsModal } from "./use_settings_modal";
import { useSpectateRemoteServerStateStore } from "./use_spectate_remote_server";

export const useAppListeners = () => {
  // Handle app initalization
  const { broadcastService, spectateRemoteService, replayService } = useServices();
  const replayPresenter = useRef(new ReplayPresenter(replayService));

  const updateProgress = (progress: Progress | null) => replayPresenter.current.updateProgress(progress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  React.useEffect(() => {
    return replayService.onReplayLoadProgressUpdate(throttledUpdateProgress);
  }, [throttledUpdateProgress, replayService]);

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
