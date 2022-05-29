import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { BroadcasterItem, StartBroadcastConfig } from "./types";

// Handlers

export const ipc_refreshBroadcastList = makeEndpoint.main(
  "refreshBroadcastList",
  <{ authToken: string }>_,
  <SuccessPayload>_,
);

export const ipc_watchBroadcast = makeEndpoint.main("watchBroadcast", <{ broadcasterId: string }>_, <SuccessPayload>_);

export const ipc_startBroadcast = makeEndpoint.main("startBroadcast", <StartBroadcastConfig>_, <SuccessPayload>_);

export const ipc_stopBroadcast = makeEndpoint.main("stopBroadcast", <EmptyPayload>_, <SuccessPayload>_);

// Events

export const ipc_broadcastListUpdatedEvent = makeEndpoint.renderer(
  "broadcast_broadcastListUpdated",
  <{ items: BroadcasterItem[] }>_,
);

export const ipc_spectateErrorOccurredEvent = makeEndpoint.renderer(
  "broadcast_spectateErrorOccurred",
  <{ errorMessage: string | null }>_,
);

export const ipc_spectateReconnectEvent = makeEndpoint.renderer("spectate_Reconnect", <EmptyPayload>_);

export const ipc_broadcastErrorOccurredEvent = makeEndpoint.renderer(
  "broadcast_broadcastErrorOccurred",
  <{ errorMessage: string | null }>_,
);

export const ipc_broadcastReconnectEvent = makeEndpoint.renderer(
  "broadcast_Reconnect",
  <{ config: StartBroadcastConfig }>_,
);

export const ipc_slippiStatusChangedEvent = makeEndpoint.renderer(
  "broadcast_slippiStatusChanged",
  <{ status: number }>_,
);

export const ipc_dolphinStatusChangedEvent = makeEndpoint.renderer(
  "broadcast_dolphinStatusChanged",
  <{ status: number }>_,
);
