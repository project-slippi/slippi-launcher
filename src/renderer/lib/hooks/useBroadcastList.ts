import type { BroadcasterItem } from "@broadcast/types";
import throttle from "lodash/throttle";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

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
  const { authService, broadcastService } = useServices();
  const items = useBroadcastListStore((store) => store.items);
  const { showError } = useToasts();

  const refresh = async () => {
    const authToken = await authService.getUserToken();
    await broadcastService.refreshBroadcastList(authToken);
  };

  // Limit refreshing to once every 2 seconds
  const throttledRefresh = throttle(() => {
    refresh().catch(showError);
  }, 2000);

  return [items, throttledRefresh] as const;
};
