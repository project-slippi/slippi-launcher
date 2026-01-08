import type { StoredAccount } from "@settings/types";
import log from "electron-log";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { AuthUser } from "@/services/auth/types";
import type { SlippiBackendService, UserData } from "@/services/slippi/types";

export const useAccount = create(
  combine(
    {
      user: undefined as AuthUser | undefined,
      loading: false,
      userData: undefined as UserData | undefined,
      serverError: false,
      displayName: "",
      emailVerificationSent: false,
      // Multi-account state
      accounts: [] as StoredAccount[],
      activeAccountId: null as string | null,
    },
    (set, get) => ({
      setUser: (user: AuthUser | undefined) => {
        if (!user) {
          set({ user: undefined });
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
      setUserData: (userData: UserData | undefined) => set({ userData }),
      setServerError: (serverError: boolean) => set({ serverError }),
      setDisplayName: (displayName: string) => set({ displayName }),
      setEmailVerificationSent: (emailVerificationSent: boolean) => set({ emailVerificationSent }),
      // Multi-account actions
      setAccounts: (accounts: StoredAccount[]) => set({ accounts }),
      setActiveAccountId: (activeAccountId: string | null) => set({ activeAccountId }),
    }),
  ),
);

let requestId = 0;
export async function refreshUserData(slippiBackendService: SlippiBackendService) {
  // We're already refreshing the key
  if (useAccount.getState().loading) {
    return;
  }

  const currentRequestId = ++requestId;
  useAccount.getState().setLoading(true);
  try {
    const userData = await slippiBackendService.fetchUserData();
    if (requestId !== currentRequestId) {
      // We've already got a new request so just do nothing.
      return;
    }

    useAccount.getState().setUserData(userData);
    useAccount.getState().setServerError(false);
  } catch (err) {
    log.warn("Error fetching play key: ", err);
    useAccount.getState().setUserData(undefined);
    useAccount.getState().setServerError(true);
  } finally {
    useAccount.getState().setLoading(false);
  }
}

export function clearUserData() {
  // Disregard any pending requests for user data.
  requestId += 1;

  useAccount.getState().setUserData(undefined);
}
