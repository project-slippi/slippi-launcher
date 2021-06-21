import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { ConsoleMirrorStatusUpdate, DiscoveredConsoleInfo, MirrorConfig } from "./types";

export const connectToConsoleMirror = makeEndpoint.main(
  "connectToConsoleMirror",
  <{ config: MirrorConfig }>_,
  <SuccessPayload>_,
);

export const disconnectFromConsoleMirror = makeEndpoint.main(
  "disconnectFromConsoleMirror",
  <{ ip: string }>_,
  <SuccessPayload>_,
);

export const startMirroring = makeEndpoint.main("startMirroring", <{ ip: string }>_, <SuccessPayload>_);

export const startDiscovery = makeEndpoint.main("startDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const stopDiscovery = makeEndpoint.main("stopDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const discoveredConsolesUpdated = makeEndpoint.renderer(
  "console_discoveredConsolesUpdated",
  <{ consoles: DiscoveredConsoleInfo[] }>_,
);

export const consoleMirrorStatusUpdated = makeEndpoint.renderer(
  "console_consoleMirrorStatusUpdated",
  <{ ip: string; info: Partial<ConsoleMirrorStatusUpdate> }>_,
);
