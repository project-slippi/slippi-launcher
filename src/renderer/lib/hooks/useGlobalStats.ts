import type { Game, GameFilters, GlobalStats } from "@replays/stats";
import { getGlobalStats } from "@replays/stats";
import type { FileResult, Progress } from "@replays/types";
import create from "zustand";
import { combine } from "zustand/middleware";

type StoreState = {
  loaded: boolean;
  loading: boolean;
  games: Game[];
  stats: GlobalStats | null;
  progress: Progress;
};

const initialState: StoreState = {
  loaded: false,
  loading: false,
  games: [],
  stats: null,
  progress: { current: 0, total: 1 },
};

export const useGlobalStats = create(
  combine(
    {
      ...initialState,
    },
    (set) => ({
      compute: (files: FileResult[], filters: GameFilters) => {
        const games = files.map(
          (file) => ({ stats: file.stats, metadata: file.metadata, settings: file.settings } as Game),
        );
        const stats = getGlobalStats(games, "EAST#312", filters);
        set({
          loading: false,
          games,
          stats,
        });
      },
      computeGlobal: async () => {
        set({ loading: true });
        window.electron.replays.onStatsProgressUpdate((progress) => useGlobalStats.setState({ progress }));
        await handleStatsCache();
        set({ loaded: true, loading: false });
      },
    }),
  ),
);

const handleStatsCache = async (): Promise<void> => {
  return window.electron.replays.computeStatsCache();
};
