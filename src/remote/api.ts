import { ipc_spectateRemoteStateEvent, ipc_startSpectateRemoteServer, ipc_stopSpectateRemoteServer } from "./ipc";
import type { SpectateRemoteService } from "./types";

const spectateRemoteApi: SpectateRemoteService = {
  onSpectateRemoteServerStateChange(handle: (state: { connected: boolean; started: boolean; port?: number }) => void) {
    const { destroy } = ipc_spectateRemoteStateEvent.renderer!.handle(async ({ connected, started, port }) => {
      handle({ connected, started, port });
    });
    return destroy;
  },
  async startSpectateRemoteServer(authToken: string, port: number) {
    const { result } = await ipc_startSpectateRemoteServer.renderer!.trigger({ authToken, port });
    return result;
  },
  async stopSpectateRemoteServer() {
    await ipc_stopSpectateRemoteServer.renderer!.trigger({});
  },
};

export default spectateRemoteApi;
