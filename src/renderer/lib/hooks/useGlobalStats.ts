import type { Game, GameFilters, GlobalStats } from "@replays/stats";
import { getGlobalStats } from "@replays/stats";
import type { FileResult, Progress } from "@replays/types";
import create from "zustand";

type StoreState = {
  active: string;
  loaded: boolean;
  loading: boolean;
  files: FileResult[];
  stats: GlobalStats | null;
  progress: Progress;
};

const initialState: StoreState = {
  active: "general",
  loaded: false,
  loading: false,
  files: [],
  stats: null,
  progress: { current: 0, total: 1 },
};

type StoreReducers = {
  init: () => void;
  compute: (files: FileResult[], filters: GameFilters) => void;
  computeGlobal: () => void;
  setActiveView: (active: string) => void;
};

export const useGlobalStats = create<StoreState & StoreReducers>((set) => ({
  // Set the initial state
  ...initialState,

  init: async () => {
    const { loaded } = (await window.electron.replays.getGlobalStatsStatus()).result;
    set({ loaded });
  },

  compute: (files: FileResult[], filters: GameFilters) => {
    const games = files.map(
      (file) => ({ stats: file.stats, metadata: file.metadata, settings: file.settings } as Game),
    );
    const stats = getGlobalStats(games, "EAST#312", filters);
    set({
      loading: false,
      files,
      stats,
    });
  },

  computeGlobal: async () => {
    set({ loading: true });
    window.electron.replays.onStatsProgressUpdate((progress) => set({ progress }));
    await handleStatsCache();
    set({ loaded: true, loading: false });
  },

  setActiveView: async (active: string) => {
    set({ active });
  },
}));

const handleStatsCache = async (): Promise<void> => {
  return window.electron.replays.computeStatsCache();
};
