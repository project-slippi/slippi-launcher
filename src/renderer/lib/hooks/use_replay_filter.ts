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
