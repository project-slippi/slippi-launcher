import type { FileResult, Progress } from "@replays/types";
import type { ProgressionStat } from "stats/progression";
import type { GameFilters, GlobalStats } from "stats/stats";
import create from "zustand";

type StoreState = {
  active: string;
  loaded: boolean;
  loading: boolean;
  files: FileResult[];
  stats: GlobalStats | null;
  general: GlobalStats | null;
  progression: ProgressionStat[];
  progress: Progress;
};

const initialState: StoreState = {
  active: "general",
  loaded: false,
  loading: false,
  files: [],
  stats: null,
  general: null,
  progression: [],
  progress: { current: 0, total: 1 },
};

type StoreReducers = {
  init: () => void;
  compute: (files: FileResult[], filters: GameFilters) => void;
  computeGlobal: () => void;
  setActiveView: (active: string) => void;
};

export const useGlobalStats = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  init: async () => {
    const { loaded } = (await window.electron.replays.getGlobalStatsStatus()).result;
    set({ loaded });
  },

  compute: async (files: FileResult[], filters: GameFilters) => {
    const oldFiles = get().files;
    if (files.length == oldFiles.length) {
      console.log("No new files to compute");
      return;
    }
    console.log("Computing stats");
    set({ loading: true });
    const names = files.map((f) => f.fullPath);
    const startTime = performance.now();
    const { stats } = await window.electron.replays.calculateGlobalStats(names, filters);
    const endTime = performance.now();
    console.log(`Computed stats in ${endTime - startTime} milliseconds`);
    set({
      loading: false,
      files,
      stats: stats.global,
      general: stats.global,
      progression: stats.timeseries,
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
