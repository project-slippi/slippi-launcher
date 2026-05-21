import { create } from "zustand";

interface RouteMemoryState {
  routeMemory: Record<string, string>;
  setLastRoute: (routeId: string, path: string) => void;
}

export const useRouteMemory = create<RouteMemoryState>((set) => ({
  routeMemory: {},
  setLastRoute: (routeId, path) => set((s) => ({ routeMemory: { ...s.routeMemory, [routeId]: path } })),
}));
