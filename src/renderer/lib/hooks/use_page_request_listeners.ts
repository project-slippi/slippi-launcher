import React from "react";

import { useReplayPresenter } from "@/lib/hooks/use_replays";
import { useServices } from "@/services";

import { useReplayBrowserNavigation } from "./use_replay_browser_list";
import { useSettingsModal } from "./use_settings_modal";

export const usePageRequestListeners = () => {
  const { replayService } = useServices();
  const replayPresenter = useReplayPresenter();

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
};
