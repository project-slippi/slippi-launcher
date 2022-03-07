import type { PlayKey } from "@dolphin/types";
import create from "zustand";
import { combine } from "zustand/middleware";

import type { AuthUser } from "@/services/auth_service/types";

import { fetchPlayKey } from "../slippiBackend";

export const useAccount = create(
  combine(
    {
      user: null as AuthUser | null,
      loading: false,
      playKey: null as PlayKey | null,
      serverError: false,
      displayName: "",
    },
    (set, get) => ({
      setUser: (user: AuthUser | null) =>
        set((store) => {
          store.user = user;
          if (user) {
            store.displayName = user.displayName || "";
          }

          return store;
        }),
      setLoading: (loading: boolean) => set({ loading }),
      setPlayKey: (playKey: PlayKey | null) => set({ playKey }),
      setServerError: (serverError: boolean) => set({ serverError }),
      setDisplayName: (displayName: string) => set({ displayName }),
      refreshPlayKey: async (): Promise<void> => {
        // We're already refreshing the key
        if (get().loading) {
          return;
        }

        set({ loading: true });
        await fetchPlayKey()
          .then((playKey) => set({ playKey, serverError: false }))
          .catch((err) => {
            console.warn("Error fetching play key: ", err);
            set({ playKey: null, serverError: true });
          })
          .finally(() => set({ loading: false }));
      },
    }),
  ),
);
