import { _, makeEndpoint, SuccessPayload } from "../ipc";
import { AppSettings } from "./types";

// Handlers

// export const getAppSettings = makeEndpoint.main("getAppSettings", <EmptyPayload>_, <AppSettings>_);

export const setIsoPath = makeEndpoint.main("setIsoPath", <{ path: string | null }>_, <SuccessPayload>_);

export const setRootSlpPath = makeEndpoint.main("setRootSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const setSpectateSlpPath = makeEndpoint.main("setSpectateSlpPath", <{ path: string }>_, <SuccessPayload>_);

export const setNetplayDolphinPath = makeEndpoint.main("setNetplayDolphinPath", <{ path: string }>_, <SuccessPayload>_);

export const setPlaybackDolphinPath = makeEndpoint.main(
  "setPlaybackDolphinPath",
  <{ path: string }>_,
  <SuccessPayload>_,
);

// Events

export const settingsUpdated = makeEndpoint.renderer("settings_settingsUpdated", <AppSettings>_);
