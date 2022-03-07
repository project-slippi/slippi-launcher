import type { BroadcasterItem } from "@broadcast/types";
import throttle from "lodash/throttle";
import { useToasts } from "react-toast-notifications";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useAccount } from "./useAccount";

export const useBroadcastListStore = create(
  combine(
    {
      items: [] as BroadcasterItem[],
    },
    (set) => ({
      setItems: (items: BroadcasterItem[]) => set({ items }),
    }),
  ),
);

export const useBroadcastList = () => {
  const currentUser = useAccount((store) => store.user);
  const items = useBroadcastListStore((store) => store.items);
  const { addToast } = useToasts();

  const refresh = async () => {
    if (!currentUser) {
      throw new Error("User is not logged in");
    }
    const authToken = await currentUser.getIdToken();
    await window.electron.broadcast.refreshBroadcastList(authToken);
  };

  // Limit refreshing to once every 2 seconds
  const throttledRefresh = throttle(() => {
    refresh().catch((err) => {
      const errMessage = err.message ?? JSON.stringify(err);
      addToast(errMessage, {
        autoDismiss: true,
        appearance: "error",
        id: errMessage,
      });
    });
  }, 2000);

  return [items, throttledRefresh] as const;
};
