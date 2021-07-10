import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { IsoValidity, NewsItem, Progress } from "./types";

export const ipc_fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const ipc_checkValidIso = makeEndpoint.main(
  "checkValidIso",
  <{ path: string }>_,
  <{ path: string; valid: IsoValidity }>_,
);

export const ipc_deleteDesktopAppPath = makeEndpoint.main("deleteDesktopAppPath", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_copyLogsToClipboard = makeEndpoint.main("copyLogsToClipboard", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_installUpdate = makeEndpoint.main("installUpdate", <EmptyPayload>_, <EmptyPayload>_); // this is just gonna restart the app so the return doesn't matter

// Events

export const ipc_launcherUpdateFoundEvent = makeEndpoint.renderer("launcherupdate_found", <{ version: string }>_);

export const ipc_launcherUpdateDownloadingEvent = makeEndpoint.renderer(
  "launcherupdate_download",
  <{ progress: Progress }>_,
);
