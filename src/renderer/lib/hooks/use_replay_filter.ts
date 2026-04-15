import type { ReplayFilter } from "@database/filters/types";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { convertToReplayFilters, parseQuery } from "../query_language";
import { ME_MARKER } from "../query_language/parser";
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
export const buildReplayFilters = (
  hideShortGames: boolean,
  searchText: string,
  userId: string | undefined,
): ReplayFilter[] => {
  console.log("Building filters for user:", userId);
  const filters: ReplayFilter[] = [];

  // Parse the search text using the query language parser
  if (searchText && searchText.trim() !== "") {
    const parsed = parseQuery(searchText);
    let queryFilters = convertToReplayFilters(parsed.filters);

    // Resolve @me to actual user ID, removing filters where resolution fails (not logged in)
    queryFilters = queryFilters.filter((filter) => {
      if (filter.type !== "player") {
        return true;
      }

      if (filter.userId === ME_MARKER) {
        // We want to replace the ME_MARKER with our actual user id
        if (!userId) {
          // User not logged in, remove this filter since it's invalid
          return false;
        }

        filter.userId = userId;
        return true;
      }

      return true;
    });

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

    if (!existingDurationFilter) {
      // Filter out the short games
      filters.push({
        type: "duration",
        minFrames: 30 * 60 - 123, // 30 seconds minus the offset
      });
    }
  }

  return filters;
};
