import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { IsoValidity, NewsItem } from "./types";

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

export const ipc_launcherUpdateDownloadingEvent = makeEndpoint.renderer(
  "launcherupdate_download",
  <{ progress: string }>_,
);

export const ipc_launcherUpdateDownloadCompleteEvent = makeEndpoint.renderer(
  "launcherupdate_downloadComplete",
  <{ version: string }>_,
);
