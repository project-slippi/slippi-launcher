import { ipc_refreshBroadcastList } from "@broadcast/ipc";
import { BroadcasterItem } from "@broadcast/types";
import throttle from "lodash/throttle";
import { useCallback } from "react";
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

  const refresh = useCallback(async () => {
    if (!currentUser) {
      throw new Error("User is not logged in");
    }
    const authToken = await currentUser.getIdToken();
    const broadcastListResult = await ipc_refreshBroadcastList.renderer!.trigger({ authToken });
    if (!broadcastListResult.result) {
      throw new Error("Error refreshing broadcast list");
    }
  }, [currentUser]);

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
