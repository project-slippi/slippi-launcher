import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

export const ipc_remoteReconnectEvent = makeEndpoint.renderer("remote_reconnect", <EmptyPayload>_);
export const ipc_remoteStateEvent = makeEndpoint.renderer(
  "remote_state",
  <{ connected: boolean; started: boolean; port?: number }>_,
);
export const ipc_startRemoteServer = makeEndpoint.main(
  "remote_startServer",
  <{ authToken: string; port: number }>_,
  <{ success: boolean; err?: string }>_,
);
export const ipc_reconnectRemoteServer = makeEndpoint.main(
  "remote_reconnectServer",
  <{ authToken: string }>_,
  <{ success: boolean }>_,
);
export const ipc_stopRemoteServer = makeEndpoint.main("remote_stopServer", <EmptyPayload>_, <SuccessPayload>_);
