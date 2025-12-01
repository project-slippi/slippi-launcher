import type { ReplayFilter } from "@database/filters/types";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { ReplaySortOption, SortDirection } from "../replay_file_sort";

export const useReplayFilter = create(
  combine(
    {
      searchText: "",
      sortBy: ReplaySortOption.DATE,
      sortDirection: SortDirection.DESC,
      hideShortGames: true,
    },
    (set) => ({
      setSearchText: (searchText: string) => set({ searchText }),
      setSortBy: (sortBy: ReplaySortOption) => set({ sortBy }),
      setSortDirection: (sortDirection: SortDirection) => set({ sortDirection }),
      setHideShortGames: (hideShortGames: boolean) => set({ hideShortGames }),
      resetFilter: () => {
        set({
          searchText: "",
          hideShortGames: false,
        });
      },
    }),
  ),
);

/**
 * Converts the current filter state to ReplayFilter array
 */
export const buildReplayFilters = (hideShortGames: boolean, searchText: string): ReplayFilter[] => {
  const filters: ReplayFilter[] = [];

  if (hideShortGames) {
    filters.push({
      type: "duration",
      minFrames: 30 * 60, // 30 seconds
    });
  }

  if (searchText && searchText.trim() !== "") {
    filters.push({
      type: "textSearch",
      query: searchText.trim(),
    });
  }

  return filters;
};
