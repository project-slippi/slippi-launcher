import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
import { NewsItem } from "./types";

export const ipc_fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const ipc_checkValidIso = makeEndpoint.main(
  "checkValidIso",
  <{ path: string }>_,
  <{ path: string; valid: boolean }>_,
);

export const ipc_getDesktopAppPath = makeEndpoint.main("getDesktopAppPath", <EmptyPayload>_, <{ exists: boolean }>_);

export const ipc_migrateDolphin = makeEndpoint.main(
  "migrateDolphin",
  <{ migrateNetplay: string | null; migratePlayback: boolean }>_,
  <SuccessPayload>_,
);
