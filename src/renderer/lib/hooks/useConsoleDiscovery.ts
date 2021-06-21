import { DiscoveredConsoleInfo } from "@console/types";
import merge from "lodash/merge";
import create from "zustand";
import { combine } from "zustand/middleware";

export const useConsoleDiscoveryStore = create(
  combine(
    {
      connectedConsoles: {} as Record<string, { status: number; nickname?: string }>,
      consoleItems: [] as DiscoveredConsoleInfo[],
    },
    (set) => ({
      updateConsoleItems: (consoleItems: DiscoveredConsoleInfo[]) => set({ consoleItems }),
      updateConsoleStatus: (ip: string, info: { status: number; nickname?: string }) =>
        set((store) => {
          const existing = store.connectedConsoles[ip];
          store.connectedConsoles[ip] = merge({}, existing, info);
          return store;
        }),
    }),
  ),
);
