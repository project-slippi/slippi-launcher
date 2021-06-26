import { PlayKey } from "@dolphin/types";
import firebase from "firebase";
import create from "zustand";
import { combine } from "zustand/middleware";

import { fetchPlayKey } from "../slippiBackend";

export const useAccount = create(
  combine(
    {
      user: null as firebase.User | null,
      loading: false,
      playKey: null as PlayKey | null,
      displayName: "",
    },
    (set, get) => ({
      setUser: (user: firebase.User | null) =>
        set((store) => {
          store.user = user;
          if (user) {
            store.displayName = user.displayName || "";
          }

          return store;
        }),
      setLoading: (loading: boolean) => set({ loading }),
      setPlayKey: (playKey: PlayKey | null) => set({ playKey }),
      setDisplayName: (displayName: string) => set({ displayName }),
      refreshPlayKey: async (): Promise<void> => {
        // We're already refreshing the key
        if (get().loading) {
          return;
        }

        set({ loading: true });
        await fetchPlayKey()
          .then((playKey) => set({ playKey }))
          .catch((err) => {
            console.warn("Error fetching play key: ", err);
            set({ playKey: null });
          })
          .finally(() => set({ loading: false }));
      },
    }),
  ),
);
