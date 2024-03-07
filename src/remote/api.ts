import {
  ipc_reconnectRemoteServer,
  ipc_remoteReconnectEvent,
  ipc_startRemoteServer,
  ipc_stopRemoteServer,
} from "./ipc";
import type { RemoteService } from "./types";

const remoteApi: RemoteService = {
  onReconnect(handle: () => void) {
    const { destroy } = ipc_remoteReconnectEvent.renderer!.handle(async () => {
      handle();
    });
    return destroy;
  },
  async startRemoteServer(authToken: string) {
    const { result } = await ipc_startRemoteServer.renderer!.trigger({ authToken });
    return result;
  },
  async reconnectRemoteServer(authToken: string) {
    const { result } = await ipc_reconnectRemoteServer.renderer!.trigger({ authToken });
    return result;
  },
  async stopRemoteServer() {
    await ipc_stopRemoteServer.renderer!.trigger({});
  },
};

export default remoteApi;
