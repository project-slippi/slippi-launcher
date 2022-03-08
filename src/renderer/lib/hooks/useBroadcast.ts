import type { StartBroadcastConfig } from "@broadcast/types";

import { useServices } from "@/services/serviceContext";

const log = console;

export const useBroadcast = () => {
  const { authService } = useServices();

  const startBroadcasting = async (config: Omit<StartBroadcastConfig, "authToken">) => {
    const authToken = await authService.getUserToken();
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
