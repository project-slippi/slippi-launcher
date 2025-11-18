import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { AuthUser } from "@/services/auth/types";
import type { SlippiBackendService, UserData } from "@/services/slippi/types";

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

export async function refreshUserData(slippiBackendService: SlippiBackendService) {
  // We're already refreshing the key
  if (useAccount.getState().loading) {
    return;
  }

  useAccount.getState().setLoading(true);
  await slippiBackendService
    .fetchUserData()
    .then((userData) => {
      useAccount.getState().setUserData(userData);
      useAccount.getState().setServerError(false);
    })
    .catch((err) => {
      console.warn("Error fetching play key: ", err);
      useAccount.getState().setUserData(null);
      useAccount.getState().setServerError(true);
    })
    .finally(() => useAccount.getState().setLoading(false));
}
