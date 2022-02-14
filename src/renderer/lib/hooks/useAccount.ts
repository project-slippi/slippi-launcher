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
      isServerError: false as boolean | null,
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
      setIsServerError: (isServerError: boolean | null) => set({ isServerError }),
      setDisplayName: (displayName: string) => set({ displayName }),
      refreshPlayKey: async (): Promise<void> => {
        // We're already refreshing the key
        if (get().loading) {
          return;
        }

        set({ loading: true });
        await fetchPlayKey()
          .then((playKey) => set({ playKey, isServerError: false }))
          .catch((err) => {
            console.warn("Error fetching play key: ", err);
            set({ playKey: null, isServerError: true });
          })
          .finally(() => set({ loading: false }));
      },
    }),
  ),
);
