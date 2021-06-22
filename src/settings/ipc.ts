import { _, makeEndpoint, SuccessPayload } from "../ipc";
import { AppSettings, StoredConnection } from "./types";

// Handlers

// export const getAppSettings = makeEndpoint.main("getAppSettings", <EmptyPayload>_, <AppSettings>_);

export const setIsoPath = makeEndpoint.main("setIsoPath", <{ isoPath: string | null }>_, <SuccessPayload>_);

export const setRootSlpPath = makeEndpoint.main("setRootSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const setSpectateSlpPath = makeEndpoint.main("setSpectateSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const setNetplayDolphinPath = makeEndpoint.main("setNetplayDolphinPath", <{ path: string }>_, <SuccessPayload>_);

export const setPlaybackDolphinPath = makeEndpoint.main(
  "setPlaybackDolphinPath",
  <{ path: string }>_,
  <SuccessPayload>_,
);

export const addNewConnection = makeEndpoint.main(
  "addNewConnection",
  <{ connection: Omit<StoredConnection, "id"> }>_,
  <SuccessPayload>_,
);

export const editConnection = makeEndpoint.main(
  "editConnection",
  <{ id: number; connection: Omit<StoredConnection, "id"> }>_,
  <SuccessPayload>_,
);

export const deleteConnection = makeEndpoint.main("deleteConnection", <{ id: number }>_, <SuccessPayload>_);

// Events

export const settingsUpdated = makeEndpoint.renderer("settings_settingsUpdated", <AppSettings>_);
