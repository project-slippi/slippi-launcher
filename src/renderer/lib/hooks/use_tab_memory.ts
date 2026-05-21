import { create } from "zustand";

interface TabMemoryState {
  lastTab: Record<string, string>;
  setLastTab: (contextKey: string, tab: string) => void;
}

export const useTabMemory = create<TabMemoryState>((set) => ({
  lastTab: {},
  setLastTab: (contextKey, tab) => set((s) => ({ lastTab: { ...s.lastTab, [contextKey]: tab } })),
}));
