import { _, EmptyPayload, makeEndpoint } from "../ipc";
import { BroadcasterItem, StartBroadcastConfig } from "./types";

// Handlers

export const fetchBroadcastList = makeEndpoint.main(
  "fetchBroadcastList",
  <{ authToken: string }>_,
  <{ items: BroadcasterItem[] }>_,
);

export const watchBroadcast = makeEndpoint.main("watchBroadcast", <{ broadcasterId: string }>_, <{ success: true }>_);

export const startBroadcast = makeEndpoint.main("startBroadcast", <StartBroadcastConfig>_, <{ success: true }>_);

export const stopBroadcast = makeEndpoint.main("stopBroadcast", <EmptyPayload>_, <{ success: true }>_);

// Events

export const broadcastErrorOccurred = makeEndpoint.renderer(
  "broadcast_broadcastErrorOccurred",
  <{ errorMessage: string | null }>_,
);

export const slippiStatusChanged = makeEndpoint.renderer("broadcast_slippiStatusChanged", <{ status: number }>_);

export const dolphinStatusChanged = makeEndpoint.renderer("broadcast_dolphinStatusChanged", <{ status: number }>_);
