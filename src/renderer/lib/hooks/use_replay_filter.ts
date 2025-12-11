import type { ReplayFilter } from "@database/filters/types";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { convertToReplayFilters, parseQuery } from "../query_language";
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
 *
 * This function now uses the query language parser to convert search text into structured filters.
 * The hideShortGames checkbox is still supported as a quick filter and merged with query filters.
 */
export const buildReplayFilters = (hideShortGames: boolean, searchText: string): ReplayFilter[] => {
  const filters: ReplayFilter[] = [];

  // Parse the search text using the query language parser
  if (searchText && searchText.trim() !== "") {
    const parsed = parseQuery(searchText);
    const queryFilters = convertToReplayFilters(parsed.filters);

    // Add all query filters
    filters.push(...queryFilters);

    // Log any parsing errors to console (for debugging)
    if (parsed.errors.length > 0) {
      console.warn("Query parsing errors:", parsed.errors);
    }
  }

  // Apply hideShortGames filter (merge with any duration filter from query)
  if (hideShortGames) {
    // Check if there's already a duration filter from the query
    const existingDurationFilter = filters.find((f) => f.type === "duration");

    if (existingDurationFilter) {
      // Merge with existing: use the maximum of the two minFrames values
      const shortGameThreshold = 30 * 60; // 30 seconds
      if (existingDurationFilter.minFrames !== undefined) {
        existingDurationFilter.minFrames = Math.max(existingDurationFilter.minFrames, shortGameThreshold);
      } else {
        existingDurationFilter.minFrames = shortGameThreshold;
      }
    } else {
      // Add new duration filter
      filters.push({
        type: "duration",
        minFrames: 30 * 60, // 30 seconds
      });
    }
  }

  return filters;
};
