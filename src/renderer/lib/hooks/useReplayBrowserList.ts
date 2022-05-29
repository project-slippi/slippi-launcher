import { useNavigate } from "react-router-dom";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useReplays } from "@/lib/hooks/useReplays";

import { replayFileFilter, replayFileSort } from "../replayFileSort";
import { useReplayFilter } from "./useReplayFilter";

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
  const files = useReplays((store) => store.files);
  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const selectFile = useReplays((store) => store.selectFile);
  const sortDirection = useReplayFilter((store) => store.sortDirection);
  const sortBy = useReplayFilter((store) => store.sortBy);
  const searchText = useReplayFilter((store) => store.searchText);
  const hideShortGames = useReplayFilter((store) => store.hideShortGames);
  const filteredFiles = files
    .filter(replayFileFilter({ searchText, hideShortGames }))
    .sort(replayFileSort(sortBy, sortDirection));
  const numHiddenFiles = files.length - filteredFiles.length;
  const { index, total } = useReplays((store) => store.selectedFile);
  const { goToReplayStatsPage } = useReplayBrowserNavigation();

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      clearSelectedFile();
      return;
    }
    const file = filteredFiles[index];
    selectFile(file, index, filteredFiles.length);
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
