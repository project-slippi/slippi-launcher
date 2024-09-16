import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { GeckoCode } from "./config/gecko_code";
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

export const ipc_hardResetDolphin = makeEndpoint.main(
  "hardResetDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_softResetDolphin = makeEndpoint.main(
  "softResetDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_openDolphinSettingsFolder = makeEndpoint.main(
  "openDolphinSettingsFolder",
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

export const ipc_fetchGeckoCodes = makeEndpoint.main(
  "fetchGeckoCodes",
  <{ dolphinType: DolphinLaunchType }>_,
  <{ codes: GeckoCode[] }>_,
);

export const ipc_saveGeckoCodes = makeEndpoint.main(
  "saveGeckoCodes",
  <{ dolphinType: DolphinLaunchType; geckoCodes: GeckoCode[] }>_,
  <SuccessPayload>_,
);

// Events

export const ipc_dolphinEvent = makeEndpoint.renderer("dolphin_dolphinEvent", <DolphinEvent>_);
