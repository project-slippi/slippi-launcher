import { refreshBroadcastList } from "@broadcast/ipc";
import { BroadcasterItem } from "@broadcast/types";
import throttle from "lodash/throttle";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useApp } from "@/store/app";

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
  const currentUser = useApp((store) => store.user);
  const items = useBroadcastListStore((store) => store.items);

  const refresh = async () => {
    if (!currentUser) {
      throw new Error("User is not logged in");
    }
    const authToken = await currentUser.getIdToken();
    const broadcastListResult = await refreshBroadcastList.renderer!.trigger({ authToken });
    if (!broadcastListResult.result) {
      throw new Error("Error refreshing broadcast list");
    }
  };

  // Limit refreshing to once every 2 seconds
  const throttledRefresh = throttle(refresh, 2000);

  return [items, throttledRefresh] as const;
};
