import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useVcRedistDialog = create(
  combine(
    {
      open: false,
    },
    (set) => ({
      openDialog: () => set({ open: true }),
      closeDialog: () => set({ open: false }),
    }),
  ),
);
