import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useServices } from "@/services";

export const useSpectateRemoteServerStateStore = create(
  combine(
    {
      connected: false,
      started: false,
      port: 0,
    },
    (set) => ({
      setState: (state: { connected: boolean; started: boolean; port?: number }) => {
        if (state.port !== undefined) {
          set(state);
        } else {
          set({ connected: state.connected, started: state.started });
        }
      },
    }),
  ),
);

export const useSpectateRemoteServer = () => {
  const state = useSpectateRemoteServerStateStore((store) => ({
    connected: store.connected,
    started: store.started,
    port: store.port,
  }));
  const { authService, spectateRemoteService } = useServices();
  const startSpectateRemoteServer = async (port: number) => {
    const authToken = await authService.getUserToken();
    return spectateRemoteService.startSpectateRemoteServer(authToken, port);
  };
  const stopSpectateRemoteServer = async () => {
    return spectateRemoteService.stopSpectateRemoteServer();
  };
  return [state, startSpectateRemoteServer, stopSpectateRemoteServer] as const;
};
