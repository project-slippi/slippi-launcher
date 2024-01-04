import create from "zustand";
import { combine } from "zustand/middleware";

export const useLoginModal = create(
  combine(
    {
      open: false,
    },
    (set) => ({
      openModal: () =>
        set({
          open: true,
        }),
      closeModal: () =>
        set({
          open: false,
        }),
    }),
  ),
);
