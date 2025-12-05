import { ipcRenderer } from "electron";

import {
  ipc_checkForUpdate,
  ipc_checkValidIso,
  ipc_clearTempFolder,
  ipc_copyLogsToClipboard,
  ipc_decryptString,
  ipc_deleteFiles,
  ipc_encryptString,
  ipc_fetchNewsFeed,
  ipc_getLatestGitHubReleaseVersion,
  ipc_installUpdate,
  ipc_isEncryptionAvailable,
  ipc_launcherUpdateDownloadingEvent,
  ipc_launcherUpdateFoundEvent,
  ipc_launcherUpdateReadyEvent,
  ipc_runNetworkDiagnostics,
  ipc_showOpenDialog,
} from "./ipc";

export default {
  onDragStart(filePaths: string[]) {
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
  // TODO: don't allow deleting of arbitrary items. Replay DB service should return a unique ID
  // for each item sent to the renderer, and the renderer should tell main the list of IDs to delete
  // rather than the file paths to delete. Remove this function once Replay DB service is ready.
  async deleteFiles(filePaths: string[]) {
    await ipc_deleteFiles.renderer!.trigger({ filePaths });
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
  async runNetworkDiagnostics() {
    const { result } = await ipc_runNetworkDiagnostics.renderer!.trigger({});
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
  // SafeStorage API for secure token encryption
  async encryptString(data: string): Promise<string> {
    const { result } = await ipc_encryptString.renderer!.trigger({ data });
    return result.encrypted;
  },
  async decryptString(encrypted: string): Promise<string> {
    const { result } = await ipc_decryptString.renderer!.trigger({ encrypted });
    return result.data;
  },
  async isEncryptionAvailable(): Promise<boolean> {
    const { result } = await ipc_isEncryptionAvailable.renderer!.trigger({});
    return result.available;
  },
};
