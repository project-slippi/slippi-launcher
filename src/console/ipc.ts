import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { DiscoveredConsoleInfo } from "./discovery";
import { MirrorConfig } from "./types";

export const addMirrorConfig = makeEndpoint.main("addMirrorConfig", <{ config: MirrorConfig }>_, <SuccessPayload>_);

export const startMirroring = makeEndpoint.main("startMirroring", <{ ip: string }>_, <SuccessPayload>_);

export const startDiscovery = makeEndpoint.main("startDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const stopDiscovery = makeEndpoint.main("stopDiscovery", <EmptyPayload>_, <SuccessPayload>_);

export const discoverConsoleFound = makeEndpoint.renderer(
  "discover_consoleFound",
  <{ console: DiscoveredConsoleInfo }>_,
);

export const discoverConsoleLost = makeEndpoint.renderer("discover_consoleLost", <{ console: DiscoveredConsoleInfo }>_);
