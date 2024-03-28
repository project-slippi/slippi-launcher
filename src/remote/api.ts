import {
  ipc_reconnectRemoteServer,
  ipc_remoteReconnectEvent,
  ipc_remoteStateEvent,
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
  async reconnectRemoteServer(authToken: string) {
    const { result } = await ipc_reconnectRemoteServer.renderer!.trigger({ authToken });
    return result;
  },
  async stopRemoteServer() {
    await ipc_stopRemoteServer.renderer!.trigger({});
  },
};

export default remoteApi;
