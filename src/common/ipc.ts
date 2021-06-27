import { _, EmptyPayload, makeEndpoint } from "../ipc";
import { NewsItem } from "./types";

export const ipc_fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const ipc_checkValidIso = makeEndpoint.main(
  "checkValidIso",
  <{ path: string }>_,
  <{ path: string; valid: boolean }>_,
);

export const ipc_getDesktopAppPath = makeEndpoint.main(
  "getDesktopAppPath",
  <EmptyPayload>_,
  <{ path: string; exists: boolean }>_,
);
