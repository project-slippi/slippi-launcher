import type { ConsoleMirrorStatusUpdate, DiscoveredConsoleInfo } from "@console/types";
import { produce } from "immer";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useConsoleDiscoveryStore = create(
  combine(
    {
      connectedConsoles: {} as Record<string, Partial<ConsoleMirrorStatusUpdate>>,
      consoleItems: [] as DiscoveredConsoleInfo[],
      // IPs the user has manually disconnected and that should not be auto-connected again
      // this session. Kept in memory only (cleared on app restart and when auto-connect is enabled).
      autoConnectOptOutIps: {} as Record<string, boolean>,
    },
    (set) => ({
      updateConsoleItems: (consoleItems: DiscoveredConsoleInfo[]) => set({ consoleItems }),
      optOutOfAutoConnect: (ip: string) =>
        set((state) =>
          produce(state, (draft) => {
            draft.autoConnectOptOutIps[ip] = true;
          }),
        ),
      allowAutoConnect: (ip: string) =>
        set((state) =>
          produce(state, (draft) => {
            delete draft.autoConnectOptOutIps[ip];
          }),
        ),
      clearAutoConnectOptOuts: () => set({ autoConnectOptOutIps: {} }),
      updateConsoleStatus: ({ ip, info }: { ip: string; info: Partial<ConsoleMirrorStatusUpdate> }) =>
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
            draft.connectedConsoles[ip].filename = info.filename ?? existing?.filename;
            draft.connectedConsoles[ip].nintendontVersion = info.nintendontVersion ?? existing?.nintendontVersion;
          }),
        ),
    }),
  ),
);
