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
      emailVerificationSent: false,
    },
    (set, get) => ({
      setUser: (user: AuthUser | null) => {
        if (!user) {
          set({ user: null });
          return;
        }

        let emailVerificationSent = get().emailVerificationSent;
        const currentUid = get().user?.uid;
        if (currentUid !== user?.uid) {
          console.log("Init verification sent to false");
          emailVerificationSent = false;
        }

        console.log({
          loc: "setUser function",
          user: user,
        });

        const displayName = user.displayName || "";
        set({ user, displayName, emailVerificationSent });
      },
      setLoading: (loading: boolean) => set({ loading }),
      setPlayKey: (playKey: PlayKey | null) => set({ playKey }),
      setServerError: (serverError: boolean) => set({ serverError }),
      setDisplayName: (displayName: string) => set({ displayName }),
      setEmailVerificationSent: (emailVerificationSent: boolean) => set({ emailVerificationSent }),
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
