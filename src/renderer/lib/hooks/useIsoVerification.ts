import create from "zustand";
import { combine } from "zustand/middleware";

export const useIsoVerification = create(
  combine(
    {
      isValidating: false,
      isValid: null as boolean | null,
    },
    (set) => ({
      setIsValidating: (val: boolean) => set({ isValidating: val }),
      setIsValid: (val: boolean | null) => set({ isValid: val }),
    }),
  ),
);
