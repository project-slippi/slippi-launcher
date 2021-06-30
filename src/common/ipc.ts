import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { IsoValidity, NewsItem } from "./types";

export const ipc_fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const ipc_checkValidIso = makeEndpoint.main(
  "checkValidIso",
  <{ path: string }>_,
  <{ path: string; valid: IsoValidity }>_,
);

export const ipc_getDesktopAppPath = makeEndpoint.main(
  "getDesktopAppPath",
  <EmptyPayload>_,
  <{ path: string; exists: boolean }>_,
);

export const ipc_deleteDesktopAppPath = makeEndpoint.main("deleteDesktopAppPath", <EmptyPayload>_, <SuccessPayload>_);
