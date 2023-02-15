import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { GeckoCode } from "./config/geckoCode";
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

/*
export const ipc_fetchSysInis = makeEndpoint.main(
  "fetchSysInis",
  <{ dolphinType: DolphinLaunchType }>_,
  <{ sysInis: string[] }>_,
);

export const ipc_toggleGeckos = makeEndpoint.main(
  "toggleGeckos",
  <{ tCodes: GeckoCode[]; iniName: string; dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_deleteGecko = makeEndpoint.main(
  "deleteGecko",
  <{ geckoCodeName: string; iniName: string; dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_addGeckoCode = makeEndpoint.main(
  "addGeckoCode",
  <{ codesToAdd: GeckoCode[]; iniName: string; dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const ipc_convertGeckoToRaw = makeEndpoint.main(
  "convertGeckoToRaw",
  <{ geckoCodeName: string; iniName: string; dolphinType: DolphinLaunchType }>_,
  <{ rawGecko: string }>_,
);
*/

// Events

export const ipc_dolphinEvent = makeEndpoint.renderer("dolphin_dolphinEvent", <DolphinEvent>_);
