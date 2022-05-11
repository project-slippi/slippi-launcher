import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { ConsoleMirrorStatusUpdate, DiscoveredConsoleInfo, MirrorConfig } from "./types";

// Endpoints

export const ipc_connectToConsoleMirror = makeEndpoint.main(
  "connectToConsoleMirror",
  <{ config: MirrorConfig }>_,
  <SuccessPayload>_,
);

export const ipc_disconnectFromConsoleMirror = makeEndpoint.main(
  "disconnectFromConsoleMirror",
  <{ ip: string }>_,
  <SuccessPayload>_,
);

export const ipc_startMirroring = makeEndpoint.main("startMirroring", <{ ip: string }>_, <SuccessPayload>_);

export const ipc_startDiscovery = makeEndpoint.main("startDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_stopDiscovery = makeEndpoint.main("stopDiscovery", <EmptyPayload>_, <SuccessPayload>_);

// Events

export const ipc_discoveredConsolesUpdatedEvent = makeEndpoint.renderer(
  "console_discoveredConsolesUpdated",
  <{ consoles: DiscoveredConsoleInfo[] }>_,
);

export const ipc_consoleMirrorStatusUpdatedEvent = makeEndpoint.renderer(
  "console_consoleMirrorStatusUpdated",
  <{ ip: string; info: Partial<ConsoleMirrorStatusUpdate> }>_,
);

export const ipc_consoleMirrorErrorMessageEvent = makeEndpoint.renderer(
  "console_consoleMirrorErrorMessageEvent",
  <{ message: string }>_,
);
