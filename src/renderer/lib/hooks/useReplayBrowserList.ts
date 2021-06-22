import { useHistory } from "react-router-dom";

import { useReplays } from "@/store/replays";

import { replayFileFilter, replayFileSort } from "../replayFileSort";
import { useReplayFilter } from "./useReplayFilter";

export const useReplayBrowserList = (path: string) => {
  const history = useHistory();
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

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      clearSelectedFile();
      return;
    }
    const file = filteredFiles[index];
    selectFile(file, index, filteredFiles.length);
    history.push(`${path}/${file.fullPath}`);
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
