import { ipcRenderer } from "electron";

import {
  ipc_checkForUpdate,
  ipc_checkValidIso,
  ipc_clearTempFolder,
  ipc_copyLogsToClipboard,
  ipc_deleteDesktopAppPath,
  ipc_fetchNewsFeed,
  ipc_getLatestGitHubReleaseVersion,
  ipc_installUpdate,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
  ipc_showOpenDialog,
} from "./ipc";

export default {
  getOsInfoSync() {
    return ipcRenderer.sendSync("getOsInfoSync") as string;
  },
  onDragState(filePaths: string[]) {
    ipcRenderer.send("onDragStart", filePaths);
  },
  async fetchNewsFeed() {
    const { result } = await ipc_fetchNewsFeed.renderer!.trigger({});
    return result;
  },
  async checkValidIso(path: string) {
    const { result } = await ipc_checkValidIso.renderer!.trigger({ path });
    return result;
  },
  async deleteDesktopAppPath() {
    await ipc_deleteDesktopAppPath.renderer!.trigger({});
  },
  async copyLogsToClipboard(): Promise<void> {
    await ipc_copyLogsToClipboard.renderer!.trigger({});
  },
  async checkForAppUpdates(): Promise<void> {
    await ipc_checkForUpdate.renderer!.trigger({});
  },
  async installAppUpdate(): Promise<void> {
    await ipc_installUpdate.renderer!.trigger({});
  },
  async getLatestGithubReleaseVersion(owner: string, repo: string): Promise<string> {
    const { result } = await ipc_getLatestGitHubReleaseVersion.renderer!.trigger({ owner, repo });
    return result.version;
  },
  async clearTempFolder() {
    const { result } = await ipc_clearTempFolder.renderer!.trigger({});
    return result;
  },
  async showOpenDialog(options: Electron.OpenDialogOptions) {
    const { result } = await ipc_showOpenDialog.renderer!.trigger(options);
    return result;
  },
  onAppUpdateFound(handle: (version: string) => void) {
    const { destroy } = ipc_launcherUpdateFoundEvent.renderer!.handle(async ({ version }) => {
      handle(version);
    });
    return destroy;
  },
  onAppUpdateDownloadProgress(handle: (percent: number) => void) {
    const { destroy } = ipc_launcherUpdateDownloadingEvent.renderer!.handle(async ({ progressPercent }) => {
      handle(progressPercent);
    });
    return destroy;
  },
  onAppUpdateReady(handle: () => void) {
    const { destroy } = ipc_launcherUpdateReadyEvent.renderer!.handle(async () => {
      handle();
    });
    return destroy;
  },
};
