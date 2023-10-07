import type { StartBroadcastConfig } from "@broadcast/types";
import log from "electron-log";

import { useServices } from "@/services";

export const useBroadcast = () => {
  const { authService, broadcastService } = useServices();

  const startBroadcasting = async (config: Omit<StartBroadcastConfig, "authToken">) => {
    const authToken = await authService.getUserToken();
    log.info("Starting broadcast");
    await broadcastService.startBroadcast({
      ...config,
      authToken,
    });
  };

  const stopBroadcasting = async () => {
    await broadcastService.stopBroadcast();
  };

  return [startBroadcasting, stopBroadcasting] as const;
};
