import create from "zustand";
import { combine } from "zustand/middleware";

const ADVANCED_USER_STORAGE_KEY = "IS_ADVANCED_USER";

const result = localStorage.getItem(ADVANCED_USER_STORAGE_KEY);
const startingValue = result === "true" || window.electron.common.isDevelopment;

export const useAdvancedUser = create(
  combine(
    {
      isAdvancedUser: startingValue,
    },
    (set) => ({
      setIsAdvancedUser: (isAdvancedUser: boolean) => {
        // Store the value for next time
        localStorage.setItem(ADVANCED_USER_STORAGE_KEY, JSON.stringify(isAdvancedUser));

        set({ isAdvancedUser });
      },
    }),
  ),
);
