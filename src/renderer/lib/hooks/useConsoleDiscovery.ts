import { ConsoleMirrorStatusUpdate, DiscoveredConsoleInfo } from "@console/types";
import produce from "immer";
import create from "zustand";
import { combine } from "zustand/middleware";

export const useConsoleDiscoveryStore = create(
  combine(
    {
      connectedConsoles: {} as Record<string, Partial<ConsoleMirrorStatusUpdate>>,
      consoleItems: [] as DiscoveredConsoleInfo[],
    },
    (set) => ({
      updateConsoleItems: (consoleItems: DiscoveredConsoleInfo[]) => set({ consoleItems }),
      updateConsoleStatus: (ip: string, info: Partial<ConsoleMirrorStatusUpdate>) =>
        set((state) =>
          produce(state, (draft) => {
            const existing = draft.connectedConsoles[ip];
            // Initialize the object if it doesn't already exist
            if (!existing) {
              draft.connectedConsoles[ip] = {};
            }

            draft.connectedConsoles[ip].nickname = info.nickname ?? existing?.nickname;
            draft.connectedConsoles[ip].status = info.status ?? existing?.status;
            draft.connectedConsoles[ip].isMirroring = info.isMirroring ?? existing?.isMirroring;

            // This value can be null so check against undefined
            if (info.filename !== undefined) {
              draft.connectedConsoles[ip].filename = info.filename;
            }
          }),
        ),
    }),
  ),
);
