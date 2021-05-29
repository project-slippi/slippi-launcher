import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { DolphinLaunchType, PlayKey } from "./types";

// Handlers

export const downloadDolphin = makeEndpoint.main("downloadDolphin", <EmptyPayload>_, <SuccessPayload>_);

export const configureDolphin = makeEndpoint.main(
  "configureDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const reinstallDolphin = makeEndpoint.main(
  "reinstallDolphin",
  <{ dolphinType: DolphinLaunchType }>_,
  <SuccessPayload>_,
);

export const storePlayKeyFile = makeEndpoint.main("storePlayKeyFile", <{ key: PlayKey }>_, <SuccessPayload>_);

export const checkPlayKeyExists = makeEndpoint.main("checkPlayKeyExists", <EmptyPayload>_, <{ exists: boolean }>_);

export const removePlayKeyFile = makeEndpoint.main("removePlayKeyFile", <EmptyPayload>_, <SuccessPayload>_);

export const viewSlpReplay = makeEndpoint.main("viewSlpReplay", <{ filePath: string }>_, <SuccessPayload>_);

export const launchNetplayDolphin = makeEndpoint.main("launchNetplayDolphin", <EmptyPayload>_, <SuccessPayload>_);

// Events

export const dolphinDownloadFinished = makeEndpoint.renderer(
  "dolphin_dolphinDownloadFinished",
  <{ error: string | null }>_,
);

export const dolphinDownloadLogReceived = makeEndpoint.renderer(
  "dolphin_dolphinDownloadLogReceived",
  <{ message: string }>_,
);
