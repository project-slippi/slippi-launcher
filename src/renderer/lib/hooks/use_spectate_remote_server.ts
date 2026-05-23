import { useMemo } from "react";
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
  const { authService, spectateRemoteService } = useServices();
  const connected = useSpectateRemoteServerStateStore((store) => store.connected);
  const started = useSpectateRemoteServerStateStore((store) => store.started);
  const port = useSpectateRemoteServerStateStore((store) => store.port);

  return useMemo(() => {
    const state = { connected, started, port };
    const startSpectateRemoteServer = async (port: number) => {
      const authToken = await authService.getUserToken();
      return spectateRemoteService.startSpectateRemoteServer(authToken, port);
    };
    const stopSpectateRemoteServer = async () => {
      return spectateRemoteService.stopSpectateRemoteServer();
    };
    return [state, startSpectateRemoteServer, stopSpectateRemoteServer] as const;
  }, [authService, connected, port, spectateRemoteService, started]);
};
