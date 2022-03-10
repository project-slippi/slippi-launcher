import type { PlayKey } from "@dolphin/types";
import { useCallback } from "react";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

export const useAccount = create(
  combine(
    {
      user: null as AuthUser | null,
      loading: false,
      playKey: null as PlayKey | null,
      serverError: false,
      displayName: "",
    },
    (set) => ({
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
    }),
  ),
);

export const usePlayKey = () => {
  const { slippiBackendService } = useServices();
  const loading = useAccount((store) => store.loading);
  const setLoading = useAccount((store) => store.setLoading);
  const setPlayKey = useAccount((store) => store.setPlayKey);
  const setServerError = useAccount((store) => store.setServerError);

  const refreshPlayKey = useCallback(async () => {
    // We're already refreshing the key
    if (loading) {
      return;
    }

    setLoading(true);
    await slippiBackendService
      .fetchPlayKey()
      .then((playKey) => {
        setPlayKey(playKey);
        setServerError(false);
      })
      .catch((err) => {
        console.warn("Error fetching play key: ", err);
        setPlayKey(null);
        setServerError(true);
      })
      .finally(() => setLoading(false));
  }, [loading, setLoading, setPlayKey, setServerError, slippiBackendService]);

  return refreshPlayKey;
};
