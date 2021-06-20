import { DiscoveredConsoleInfo } from "@console/types";
import create from "zustand";
import { combine } from "zustand/middleware";

export const useConsoleDiscoveryStore = create(
  combine(
    {
      consoleItems: [] as DiscoveredConsoleInfo[],
    },
    (set) => ({
      updateConsoleItems: (consoleItems: DiscoveredConsoleInfo[]) => set({ consoleItems }),
    }),
  ),
);
