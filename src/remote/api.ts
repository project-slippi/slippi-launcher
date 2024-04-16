import { ipc_remoteStateEvent, ipc_startRemoteServer, ipc_stopRemoteServer } from "./ipc";
import type { RemoteService } from "./types";

const remoteApi: RemoteService = {
  onState(handle: (connected: boolean, started: boolean, port?: number) => void) {
    const { destroy } = ipc_remoteStateEvent.renderer!.handle(async ({ connected, started, port }) => {
      handle(connected, started, port);
    });
    return destroy;
  },
  async startRemoteServer(authToken: string, port: number) {
    const { result } = await ipc_startRemoteServer.renderer!.trigger({ authToken, port });
    return result;
  },
  async stopRemoteServer() {
    await ipc_stopRemoteServer.renderer!.trigger({});
  },
};

export default remoteApi;
