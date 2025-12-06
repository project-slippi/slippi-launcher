import type { BroadcasterItem } from "@broadcast/types";
import throttle from "lodash/throttle";
import React from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

export const useBroadcastListStore = create(
  combine(
    {
      currentBroadcasts: [] as BroadcasterItem[],
    },
    (set) => ({
      setCurrentBroadcasts: (currentBroadcasts: BroadcasterItem[]) => set({ currentBroadcasts }),
    }),
  ),
);

export const useBroadcastList = () => {
  const { authService, broadcastService } = useServices();
  const { showError } = useToasts();

  return React.useMemo((): {
    refreshBroadcasts: () => void;
  } => {
    const refresh = async () => {
      const authToken = await authService.getUserToken();
      await broadcastService.connectToSpectateServer(authToken);
      await broadcastService.refreshBroadcastList().catch(showError);
    };

    // Limit refreshing to once every 2 seconds
    const throttledRefresh = throttle(refresh, 2000);

    return {
      refreshBroadcasts: () => {
        void throttledRefresh();
      },
    };
  }, [authService, broadcastService, showError]);
};
