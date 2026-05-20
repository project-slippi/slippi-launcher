import { create } from "zustand";

interface TabMemoryState {
  lastTab: Record<string, string>;
  tabState: Record<string, Record<string, string | null>>;
  setLastTab: (contextKey: string, tab: string) => void;
  setTabParam: (contextKey: string, tab: string, param: string, value: string | null) => void;
}

export const useTabMemory = create<TabMemoryState>((set) => ({
  lastTab: {},
  tabState: {},
  setLastTab: (contextKey, tab) => set((s) => ({ lastTab: { ...s.lastTab, [contextKey]: tab } })),
  setTabParam: (contextKey, tab, param, value) =>
    set((s) => {
      const key = `${contextKey}:${tab}`;
      const existing = s.tabState[key] ?? {};
      return {
        tabState: { ...s.tabState, [key]: { ...existing, [param]: value } },
      };
    }),
}));
