import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

export const ipc_startSpectateRemoteServer = makeEndpoint.main(
  "startSpectateRemoteServer",
  <{ authToken: string; port: number }>_,
  <{ success: boolean; err?: string }>_,
);

export const ipc_stopSpectateRemoteServer = makeEndpoint.main(
  "stopSpectateRemoteServer",
  <EmptyPayload>_,
  <SuccessPayload>_,
);

// Events

export const ipc_spectateRemoteStateEvent = makeEndpoint.renderer(
  "remote_spectateRemoteState",
  <{ connected: boolean; started: boolean; port?: number }>_,
);
