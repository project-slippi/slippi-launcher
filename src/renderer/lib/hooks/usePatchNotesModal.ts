import create from "zustand";
import { combine } from "zustand/middleware";

export const usePatchNotesModal = create(
  combine(
    {
      open: false,
    },
    (set) => ({
      openPatchNotesModal: () =>
        set({
          open: true,
        }),
      closePatchNotesModal: () =>
        set({
          open: false,
        }),
    }),
  ),
);
