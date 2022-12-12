import { useCallback } from "react";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";
import type { UserData } from "@/services/slippi/types";

export const useAccount = create(
  combine(
    {
      user: null as AuthUser | null,
      loading: false,
      userData: null as UserData | null,
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
          emailVerificationSent = false;
        }

        const displayName = user.displayName || "";
        set({ user, displayName, emailVerificationSent });
      },
      setLoading: (loading: boolean) => set({ loading }),
      setUserData: (userData: UserData | null) => set({ userData }),
      setServerError: (serverError: boolean) => set({ serverError }),
      setDisplayName: (displayName: string) => set({ displayName }),
      setEmailVerificationSent: (emailVerificationSent: boolean) => set({ emailVerificationSent }),
    }),
  ),
);

export const useUserData = () => {
  const { slippiBackendService } = useServices();
  const loading = useAccount((store) => store.loading);
  const setLoading = useAccount((store) => store.setLoading);
  const setUserData = useAccount((store) => store.setUserData);
  const setServerError = useAccount((store) => store.setServerError);

  const refreshUserData = useCallback(async () => {
    // We're already refreshing the key
    if (loading) {
      return;
    }

    setLoading(true);
    await slippiBackendService
      .fetchUserData()
      .then((userData) => {
        setUserData(userData);
        setServerError(false);
      })
      .catch((err) => {
        console.warn("Error fetching play key: ", err);
        setUserData(null);
        setServerError(true);
      })
      .finally(() => setLoading(false));
  }, [loading, setLoading, setUserData, setServerError, slippiBackendService]);

  return refreshUserData;
};
