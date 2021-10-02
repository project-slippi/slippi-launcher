import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { DolphinLaunchType, PlayKey, ReplayQueueItem } from "./types";

// Handlers

export const ipc_downloadDolphin = makeEndpoint.main("downloadDolphin", <EmptyPayload>_, <SuccessPayload>_);

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

export const ipc_checkPlayKeyExists = makeEndpoint.main("checkPlayKeyExists", <EmptyPayload>_, <{ exists: boolean }>_);

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

export const ipc_dolphinDownloadFinishedEvent = makeEndpoint.renderer(
  "dolphin_dolphinDownloadFinished",
  <{ error: string | null }>_,
);

export const ipc_dolphinDownloadLogReceivedEvent = makeEndpoint.renderer(
  "dolphin_dolphinDownloadLogReceived",
  <{ message: string }>_,
);

export const ipc_externalDolphinOpenedEvent = makeEndpoint.renderer(
  "dolphin_externalDolphinOpenedEvent",
  <{ dolphinType: DolphinLaunchType }>_,
);

export const ipc_dolphinClosedEvent = makeEndpoint.renderer(
  "dolphin_dolphinClosed",
  <{ dolphinType: DolphinLaunchType }>_,
);

export const ipc_externalDolphinClosedEvent = makeEndpoint.renderer(
  "dolphin_externalDolphinClosedEvent",
  <{ dolphinType: DolphinLaunchType }>_,
);
