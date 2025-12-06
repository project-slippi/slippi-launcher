import type { BroadcastService, StartBroadcastConfig } from "@broadcast/types";
import log from "electron-log";

import { useBroadcastListStore } from "@/lib/hooks/use_broadcast_list";
import type { AuthService } from "@/services/auth/types";

import { useConsole } from "../lib/hooks/use_console";

export function installBroadcastListeners({
  broadcastService,
  authService,
}: {
  broadcastService: BroadcastService;
  authService: AuthService;
}) {
  broadcastService.onSlippiStatusChanged((status) => {
    useConsole.getState().setSlippiConnectionStatus(status);
  });

  broadcastService.onDolphinStatusChanged((status) => {
    useConsole.getState().setDolphinConnectionStatus(status);
  });

  broadcastService.onBroadcastErrorMessage((error) => {
    useConsole.getState().setBroadcastError(error);
  });

  // Listen to when the list of broadcasting users has changed
  broadcastService.onBroadcastListUpdated((items) => {
    useBroadcastListStore.getState().setCurrentBroadcasts(items);
  });

  const startBroadcast = async (config: StartBroadcastConfig) => {
    const authToken = await authService.getUserToken();
    log.info("Starting broadcast");
    await broadcastService.startBroadcast({
      ...config,
      authToken,
    });
  };
  broadcastService.onBroadcastReconnect((config) => {
    void startBroadcast(config).catch(log.error);
  });

  const connectToSpectateServer = async () => {
    const authToken = await authService.getUserToken();
    await broadcastService.connectToSpectateServer(authToken);
  };
  broadcastService.onSpectateReconnect(() => {
    void connectToSpectateServer().catch(log.error);
  });
}
