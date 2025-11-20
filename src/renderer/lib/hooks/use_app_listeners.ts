/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Progress } from "@replays/types";
import throttle from "lodash/throttle";
import React from "react";

import { useReplayPresenter } from "@/lib/hooks/use_replays";
import { useServices } from "@/services";

import { useReplayBrowserNavigation } from "./use_replay_browser_list";
import { useSettings } from "./use_settings";
import { useSettingsModal } from "./use_settings_modal";

export const useAppListeners = () => {
  // Handle app initalization
  const { replayService } = useServices();
  const replayPresenter = useReplayPresenter();

  const updateProgress = (progress: Progress | null) => replayPresenter.updateProgress(progress);
  const throttledUpdateProgress = throttle(updateProgress, 50);
  React.useEffect(() => {
    return replayService.onReplayLoadProgressUpdate(throttledUpdateProgress);
  }, [throttledUpdateProgress, replayService]);

  const { goToReplayStatsPage } = useReplayBrowserNavigation();
  const moveToStatsPage = React.useCallback(
    (filePath: string) => {
      replayPresenter.clearSelectedFile();
      goToReplayStatsPage(filePath);
    },
    [goToReplayStatsPage, replayPresenter],
  );
  React.useEffect(() => {
    return replayService.onStatsPageRequest(moveToStatsPage);
  }, [moveToStatsPage, replayService]);

  const { open } = useSettingsModal();
  React.useEffect(() => {
    return window.electron.settings.onOpenSettingsPageRequest(open);
  }, [open]);

  // Initialize the replay browser once and refresh on SLP path changes
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  React.useEffect(() => {
    replayPresenter.init(rootSlpPath, extraSlpPaths, true).catch(console.error);
  }, [rootSlpPath, extraSlpPaths, replayPresenter]);
};
