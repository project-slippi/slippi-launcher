import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

export const ipc_spectateRemoteStateEvent = makeEndpoint.renderer(
  "remote_state",
  <{ connected: boolean; started: boolean; port?: number }>_,
);
export const ipc_startSpectateRemoteServer = makeEndpoint.main(
  "remote_startServer",
  <{ authToken: string; port: number }>_,
  <{ success: boolean; err?: string }>_,
);
export const ipc_stopSpectateRemoteServer = makeEndpoint.main("remote_stopServer", <EmptyPayload>_, <SuccessPayload>_);
