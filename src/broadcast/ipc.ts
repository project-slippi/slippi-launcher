import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { BroadcasterItem, StartBroadcastConfig } from "./types";

// Handlers

export const refreshBroadcastList = makeEndpoint.main(
  "refreshBroadcastList",
  <{ authToken: string }>_,
  <SuccessPayload>_,
);

export const watchBroadcast = makeEndpoint.main("watchBroadcast", <{ broadcasterId: string }>_, <SuccessPayload>_);

export const startBroadcast = makeEndpoint.main("startBroadcast", <StartBroadcastConfig>_, <SuccessPayload>_);

export const stopBroadcast = makeEndpoint.main("stopBroadcast", <EmptyPayload>_, <SuccessPayload>_);

// Events

export const broadcastListUpdated = makeEndpoint.renderer(
  "broadcast_broadcastListUpdated",
  <{ items: BroadcasterItem[] }>_,
);

export const spectateErrorOccurred = makeEndpoint.renderer(
  "broadcast_spectateErrorOccurred",
  <{ errorMessage: string | null }>_,
);

export const broadcastErrorOccurred = makeEndpoint.renderer(
  "broadcast_broadcastErrorOccurred",
  <{ errorMessage: string | null }>_,
);

export const slippiStatusChanged = makeEndpoint.renderer("broadcast_slippiStatusChanged", <{ status: number }>_);

export const dolphinStatusChanged = makeEndpoint.renderer("broadcast_dolphinStatusChanged", <{ status: number }>_);
