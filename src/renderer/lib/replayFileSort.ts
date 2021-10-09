import { FileResult } from "@replays/types";
import { Frames } from "@slippi/slippi-js";
import { extractAllPlayerNames, namesMatch } from "common/matchNames";
import compareFunc from "compare-func";

// The minimum duration of games when filtering out short games
const MIN_GAME_DURATION_FRAMES = 30 * 60;

export enum ReplaySortOption {
  DATE = "DATE",
  GAME_DURATION = "GAME_DURATION",
}

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export function replayFileSort(
  key: ReplaySortOption,
  direction: SortDirection,
): (a: FileResult, b: FileResult) => number {
  const ordering = [{ key, direction }, ...defaultSortOrder];
  return (a, b) => {
    for (const order of ordering) {
      const sortFunc = compareFunc(sortByValue(order.key));
      const sortValue = sortFunc(a, b);

      // If the value is the same, then sort by the next criteria
      if (sortValue === 0) {
        continue;
      }

      // Handle the reverse direction sorting
      if (order.direction === SortDirection.ASC) {
        return sortValue;
      }
      return sortValue * -1;
    }

    return 0;
  };
}

const sortByValue = (key: ReplaySortOption): ((file: FileResult) => any) => {
  return (file) => {
    switch (key) {
      case ReplaySortOption.GAME_DURATION: {
        return file.details?.lastFrame ?? Frames.FIRST;
      }
      case ReplaySortOption.DATE: {
        return file.details?.startTime ? Date.parse(file.details.startTime) : new Date(file.header.birthtimeMs);
      }
    }
  };
};

const defaultSortOrder: Array<{
  key: ReplaySortOption;
  direction: SortDirection;
}> = [
  {
    key: ReplaySortOption.DATE,
    direction: SortDirection.DESC,
  },
];

export interface ReplayFilterOptions {
  searchText: string;
  hideShortGames: boolean;
}

export const replayFileFilter = (filterOptions: ReplayFilterOptions): ((file: FileResult) => boolean) => (file) => {
  if (file.details === null) {
    return false;
  }
  const details = file.details;
  if (filterOptions.hideShortGames) {
    if (details.lastFrame !== null && details.lastFrame <= MIN_GAME_DURATION_FRAMES) {
      return false;
    }
  }

  // First try to match names
  const playerNamesMatch = (): boolean => {
    const matchable = extractAllPlayerNames(details.settings, details.metadata);
    if (!filterOptions.searchText) {
      return true;
    } else if (matchable.length === 0) {
      return false;
    }
    return namesMatch([filterOptions.searchText], matchable);
  };
  if (playerNamesMatch()) {
    return true;
  }

  // Match filenames
  if (file.header.name.toLowerCase().includes(filterOptions.searchText.toLowerCase())) {
    return true;
  }

  return false;
};
