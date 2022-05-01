import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { DolphinEvent, DolphinLaunchType, PlayKey, ReplayQueueItem } from "./types";

// Handlers

export const ipc_downloadDolphin = makeEndpoint.main(
  "downloadDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_configureDolphin = makeEndpoint.main(
  "configureDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_reinstallDolphin = makeEndpoint.main(
  "reinstallDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_clearDolphinCache = makeEndpoint.main(
  "clearDolphinCache",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_storePlayKeyFile = makeEndpoint.main("storePlayKeyFile", <{ key: PlayKey }>_, <SuccessPayload>_);

export const ipc_checkPlayKeyExists = makeEndpoint.main(
  "checkPlayKeyExists",
  <{ key: PlayKey }>_,
  <{ exists: boolean }>_,
);

export const ipc_removePlayKeyFile = makeEndpoint.main("removePlayKeyFile", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_viewSlpReplay = makeEndpoint.main("viewSlpReplay", <{ files: ReplayQueueItem[] }>_, <SuccessPayload>_);

export const ipc_launchNetplayDolphin = makeEndpoint.main(
  "launchNetplayDolphin",
  <{ bootToCss?: boolean }>_,
  <SuccessPayload>_,
);

export const ipc_checkDesktopAppDolphin = makeEndpoint.main(
  "getDesktopAppDolphinPath",
  <EmptyPayload>_,
  <{ dolphinPath: string; exists: boolean }>_,
);

// toImportDolphin path must point to a "Slippi Dolphin.{exe,app}"
export const ipc_importDolphinSettings = makeEndpoint.main(
  "importDolphinSettings",
  <{ toImportDolphinPath: string; dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

// Events

export const ipc_dolphinEvent = makeEndpoint.renderer("dolphin_dolphinEvent", <DolphinEvent>_);
