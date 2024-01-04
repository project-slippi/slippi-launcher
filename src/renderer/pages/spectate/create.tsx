import type { BroadcastService } from "@broadcast/types";
import React from "react";

import { useAccount } from "@/lib/hooks/use_account";
import { useBroadcastList } from "@/lib/hooks/use_broadcast_list";

import { SpectatePage } from "./spectate_page";

export type CreateSpectatePageArgs = {
  broadcastService: BroadcastService;
};

export function createSpectatePage({ broadcastService }: CreateSpectatePageArgs): {
  Page: React.ComponentType;
} {
  const watchBroadcast = (id: string) => {
    void broadcastService.watchBroadcast(id);
  };

  const Page = React.memo(() => {
    const user = useAccount((store) => store.user);
    const [currentBroadcasts, refreshBroadcasts] = useBroadcastList();
    return (
      <SpectatePage
        userId={user?.uid}
        watchBroadcast={watchBroadcast}
        broadcasts={currentBroadcasts}
        onRefreshBroadcasts={refreshBroadcasts}
      />
    );
  });

  return { Page };
}
