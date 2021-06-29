import { Dirent } from "fs-extra";

import { _, EmptyPayload, makeEndpoint, SuccessPayload } from "../ipc";
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

export const ipc_migrateDolphin = makeEndpoint.main(
  "deleteFolder",
  <{ migrateNetplay: string | null; migratePlayback: string | null; desktopAppPath: string | null }>_,
  <SuccessPayload>_,
);

export const ipc_getFolderContents = makeEndpoint.main(
  "getFolderContents",
  <{ path: string }>_,
  <{ success: boolean; contents: Dirent[] }>_,
);
