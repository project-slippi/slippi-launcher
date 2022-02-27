import type { StartBroadcastConfig } from "@broadcast/types";

import { useAccount } from "./useAccount";

const log = console;

export const useBroadcast = () => {
  const user = useAccount((store) => store.user);

  const startBroadcasting = async (config: Omit<StartBroadcastConfig, "authToken">) => {
    if (!user) {
      throw new Error("User is not logged in!");
    }

    const authToken = await user.getIdToken();
    log.info("Starting broadcast");
    await window.electron.broadcast.startBroadcast({
      ...config,
      authToken,
    });
  };

  const stopBroadcasting = async () => {
    await window.electron.broadcast.stopBroadcast();
  };

  return [startBroadcasting, stopBroadcasting] as const;
};
