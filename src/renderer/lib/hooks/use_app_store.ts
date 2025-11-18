import { create } from "zustand";
import { combine } from "zustand/middleware";

import { getSystemLanguage } from "@/services/i18n/util";

export const useAppStore = create(
  combine(
    {
      updateVersion: "",
      updateDownloadProgress: 0,
      updateReady: false,
      currentLanguage: getSystemLanguage(),
    },
    (set) => ({
      setUpdateVersion: (updateVersion: string) => set({ updateVersion }),
      setUpdateDownloadProgress: (updateDownloadProgress: number) => set({ updateDownloadProgress }),
      setUpdateReady: (updateReady: boolean) => set({ updateReady }),
      setCurrentLanguage: (currentLanguage: string) => set({ currentLanguage }),
    }),
  ),
);
