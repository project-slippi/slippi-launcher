import type { SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { SettingUpdate, StoredConnection } from "./types";

/**
 * Generic endpoints for the new settings system
 */

export const ipc_updateSettings = makeEndpoint.main(
  "updateSettings",
  <{ updates: SettingUpdate[] }>_,
  <SuccessPayload>_,
);

/**
 * Connection management endpoints
 * (Kept separate because they have special logic for ID generation)
 */

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

/**
 * Events
 */

// Incremental setting updates (used for syncing changes efficiently)
export const ipc_settingChangedEvent = makeEndpoint.renderer(
  "settings_settingChanged",
  <{ updates: SettingUpdate[] }>_,
);

export const ipc_openSettingsModalEvent = makeEndpoint.renderer("openSettingsModal", <Record<string, never>>_);
