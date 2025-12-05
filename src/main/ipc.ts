import type { IsoValidity, NatType, NewsItem, PortMapping, Presence } from "@common/types";
import type { EmptyPayload, SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

export const ipc_fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const ipc_checkValidIso = makeEndpoint.main(
  "checkValidIso",
  <{ path: string }>_,
  <{ path: string; valid: IsoValidity }>_,
);

export const ipc_copyLogsToClipboard = makeEndpoint.main("copyLogsToClipboard", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_checkForUpdate = makeEndpoint.main("checkForUpdate", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_installUpdate = makeEndpoint.main("installUpdate", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_deleteFiles = makeEndpoint.main("deleteFiles", <{ filePaths: string[] }>_, <SuccessPayload>_);

export const ipc_getLatestGitHubReleaseVersion = makeEndpoint.main(
  "getLatestGitHubReleaseVersion",
  <{ owner: string; repo: string }>_,
  <{ version: string }>_,
);

export const ipc_showOpenDialog = makeEndpoint.main(
  "showOpenDialog",
  <Electron.OpenDialogOptions>_,
  <{ filePaths: string[]; canceled: boolean }>_,
);

export const ipc_clearTempFolder = makeEndpoint.main("clearTempFolder", <EmptyPayload>_, <SuccessPayload>_);

export const ipc_runNetworkDiagnostics = makeEndpoint.main(
  "runNetworkDiagnostics",
  <EmptyPayload>_,
  <{ address: string; cgnat: Presence; natType: NatType; portMapping: PortMapping }>_,
);

// Events

export const ipc_launcherUpdateFoundEvent = makeEndpoint.renderer("launcherupdate_found", <{ version: string }>_);

export const ipc_launcherUpdateDownloadingEvent = makeEndpoint.renderer(
  "launcherupdate_download",
  <{ progressPercent: number }>_,
);

export const ipc_launcherUpdateReadyEvent = makeEndpoint.renderer("launcherupdate_ready", <EmptyPayload>_);
