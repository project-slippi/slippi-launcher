import { useHistory } from "react-router-dom";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useReplays } from "@/store/replays";

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
  const history = useHistory();
  const lastPath = useReplayBrowserNavigationStore((store) => store.lastPath);
  const setLastPath = useReplayBrowserNavigationStore((store) => store.setLastPath);

  const navigate = (pageUrl: string) => {
    setLastPath(pageUrl);
    history.push(pageUrl);
  };

  const goToReplayStatsPage = (filePath: string) => {
    const pageUrl = `/main/replays/${filePath}`;
    navigate(pageUrl);
  };

  const goToReplayList = () => {
    const pageUrl = `/main/replays/list`;
    navigate(pageUrl);
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
