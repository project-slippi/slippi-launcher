import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useServices } from "@/services";

export const useRemoteServerStateStore = create(
  combine(
    {
      connected: false,
      started: false,
      port: 0,
    },
    (set) => ({
      setState: (connected: boolean, started: boolean, port?: number) => {
        if (port !== undefined) {
          set({ connected, started, port });
        } else {
          set({ connected, started });
        }
      },
    }),
  ),
);

export const useRemoteServer = () => {
  const state = useRemoteServerStateStore((store) => ({
    connected: store.connected,
    started: store.started,
    port: store.port,
  }));
  const { authService, remoteService } = useServices();
  const startRemoteServer = async (port: number) => {
    const authToken = await authService.getUserToken();
    return remoteService.startRemoteServer(authToken, port);
  };
  const stopRemoteServer = async () => {
    return remoteService.stopRemoteServer();
  };
  return [state, startRemoteServer, stopRemoteServer] as const;
};
