import { exists } from "@common/exists";
import type { FileResult } from "@replays/types";
// import { Frames, GameMode } from "@slippi/slippi-js";
import compareFunc from "compare-func";

import { namesMatch } from "@/lib/matchNames";

// The minimum duration of games when filtering out short games
// const MIN_GAME_DURATION_FRAMES = 30 * 60;
// const STADIUM_GAME_MODES = [GameMode.HOME_RUN_CONTEST, GameMode.TARGET_TEST];

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

const sortByValue = (key: ReplaySortOption): ((val: FileResult) => any) => {
  return (file) => {
    switch (key) {
      case ReplaySortOption.GAME_DURATION: {
        return file.game.durationMs;
      }
      case ReplaySortOption.DATE: {
        const startTime = file.game.startTime;
        return startTime ? Date.parse(startTime) : 0;
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

export type ReplayFilterOptions = {
  searchText: string;
  hideShortGames: boolean;
};

export const replayFileFilter =
  (filterOptions: ReplayFilterOptions): ((file: FileResult) => boolean) =>
  (file) => {
    if (filterOptions.hideShortGames) {
      // TODO: make sure this logic exists at the mapping stage
      // if (STADIUM_GAME_MODES.every((stadiumGameMode) => file.settings.gameMode !== stadiumGameMode)) {
      //   if (file.lastFrame !== null && file.lastFrame <= MIN_GAME_DURATION_FRAMES) {
      //     return false;
      //   }
      // }
    }

    // First try to match names
    const playerNamesMatch = (): boolean => {
      const matchable = matchablePlayerNames(file);
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
    if (file.fileName.toLowerCase().includes(filterOptions.searchText.toLowerCase())) {
      return true;
    }

    return false;
  };

function matchablePlayerNames(file: FileResult): string[] {
  return file.game.players.flatMap((player) => {
    return [player.displayName, player.tag, player.connectCode].filter(exists);
  });
}
