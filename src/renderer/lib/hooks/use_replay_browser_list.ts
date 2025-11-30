import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useReplayPresenter, useReplays } from "@/lib/hooks/use_replays";

import { replayFileFilter } from "../replay_file_sort";
import { useReplayFilter } from "./use_replay_filter";

const useReplayBrowserNavigationStore = create(
  combine(
    {
      lastPath: "/main/replays/list",
    },
    (set) => ({
      setLastPath: (lastPath: string) => set({ lastPath }),
    }),
  ),
);

export const useReplayBrowserNavigation = () => {
  const navigate = useNavigate();
  const lastPath = useReplayBrowserNavigationStore((store) => store.lastPath);
  const setLastPath = useReplayBrowserNavigationStore((store) => store.setLastPath);

  const goToPage = (pageUrl: string) => {
    setLastPath(pageUrl);
    navigate(pageUrl);
  };

  const goToReplayStatsPage = (filePath: string) => {
    const encodedPath = encodeURIComponent(filePath);
    const pageUrl = `/main/replays/${encodedPath}`;
    goToPage(pageUrl);
  };

  const goToReplayList = () => {
    const pageUrl = `/main/replays/list`;
    goToPage(pageUrl);
  };

  return {
    lastPath,
    goToReplayStatsPage,
    goToReplayList,
  };
};

export const useReplayBrowserList = () => {
  const presenter = useReplayPresenter();
  const files = useReplays((store) => store.files);
  const searchText = useReplayFilter((store) => store.searchText);
  // Note: Files are already sorted and filtered by backend (except for text search)
  // Only apply text filtering here
  const filteredFiles = files.filter(replayFileFilter({ searchText, hideShortGames: false }));
  const numHiddenFiles = files.length - filteredFiles.length;
  const { index, total } = useReplays((store) => store.selectedFile);
  const { goToReplayStatsPage } = useReplayBrowserNavigation();

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      presenter.clearSelectedFile();
      return;
    }
    const file = filteredFiles[index];
    presenter.selectFile(file, index, filteredFiles.length);
    goToReplayStatsPage(file.fullPath);
  };

  const selectNextFile = () => {
    if (index === null) {
      return;
    }
    if (index < filteredFiles.length - 1) {
      setSelectedItem(index + 1);
    }
  };

  const selectPrevFile = () => {
    if (index === null) {
      return;
    }
    if (index > 0) {
      setSelectedItem(index - 1);
    }
  };

  return {
    hiddenFileCount: numHiddenFiles,
    files: filteredFiles,
    index,
    total,
    selectNextFile,
    selectPrevFile,
  };
};
