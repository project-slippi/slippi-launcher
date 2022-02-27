import { IsoValidity } from "@common/types";
import create from "zustand";
import { combine } from "zustand/middleware";

export const useIsoVerification = create(
  combine(
    {
      isValidating: false,
      validity: IsoValidity.UNVALIDATED,
    },
    (set) => ({
      setIsValidating: (val: boolean) => set({ isValidating: val }),
      setIsValid: (val: IsoValidity) => set({ validity: val }),
    }),
  ),
);
