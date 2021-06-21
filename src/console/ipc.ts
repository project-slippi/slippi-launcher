import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { DiscoveredConsoleInfo, MirrorConfig } from "./types";

export const addMirrorConfig = makeEndpoint.main("addMirrorConfig", <{ config: MirrorConfig }>_, <SuccessPayload>_);

export const startMirroring = makeEndpoint.main("startMirroring", <{ ip: string }>_, <SuccessPayload>_);

export const startDiscovery = makeEndpoint.main("startDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const stopDiscovery = makeEndpoint.main("stopDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const discoveredConsolesUpdated = makeEndpoint.renderer(
  "console_discoveredConsolesUpdated",
  <{ consoles: DiscoveredConsoleInfo[] }>_,
);

export const consoleMirrorStatusUpdated = makeEndpoint.renderer(
  "console_consoleMirrorStatusUpdated",
  <{ ip: string; status: number; nickname?: string }>_,
);
