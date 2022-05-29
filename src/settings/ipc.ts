import type { SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { AppSettings, StoredConnection } from "./types";

// Handlers

export const ipc_setIsoPath = makeEndpoint.main("setIsoPath", <{ isoPath: string | null }>_, <SuccessPayload>_);

export const ipc_setRootSlpPath = makeEndpoint.main("setRootSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const ipc_setUseMonthlySubfolders = makeEndpoint.main(
  "setUseMonthlySubfolders",
  <{ toggle: boolean }>_,
  <SuccessPayload>_,
);

export const ipc_setSpectateSlpPath = makeEndpoint.main("setSpectateSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const ipc_setExtraSlpPaths = makeEndpoint.main("setExtraSlpPaths", <{ paths: string[] }>_, <SuccessPayload>_);

export const ipc_setNetplayDolphinPath = makeEndpoint.main(
  "setNetplayDolphinPath",
  <{ path: string }>_,
  <SuccessPayload>_,
);

export const ipc_setPlaybackDolphinPath = makeEndpoint.main(
  "setPlaybackDolphinPath",
  <{ path: string }>_,
  <SuccessPayload>_,
);

export const ipc_setLaunchMeleeOnPlay = makeEndpoint.main(
  "setLaunchMeleeOnPlay",
  <{ launchMelee: boolean }>_,
  <SuccessPayload>_,
);

export const ipc_setAutoUpdateLauncher = makeEndpoint.main(
  "setAutoUpdateLauncher",
  <{ autoUpdateLauncher: boolean }>_,
  <SuccessPayload>_,
);

export const ipc_addNewConnection = makeEndpoint.main(
  "addNewConnection",
  <{ connection: Omit<StoredConnection, "id"> }>_,
  <SuccessPayload>_,
);

export const ipc_editConnection = makeEndpoint.main(
  "editConnection",
  <{ id: number; connection: Omit<StoredConnection, "id"> }>_,
  <SuccessPayload>_,
);

export const ipc_deleteConnection = makeEndpoint.main("deleteConnection", <{ id: number }>_, <SuccessPayload>_);

// Events

export const ipc_settingsUpdatedEvent = makeEndpoint.renderer("settings_settingsUpdated", <AppSettings>_);

export const ipc_openSettingsModalEvent = makeEndpoint.renderer("openSettingsModal", <Record<string, never>>_);
