/* eslint-disable import/no-default-export */
import {
  ipc_calculateGameStats,
  ipc_computeStatsCache,
  ipc_getStatsStatus,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
  ipc_statsPageRequestedEvent,
  ipc_statsProgressUpdatedEvent,
} from "./ipc";
import type { Progress } from "./types";

export default {
  async loadReplayFolder(folderPath: string) {
    const { result } = await ipc_loadReplayFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async initializeFolderTree(folders: readonly string[]) {
    const { result } = await ipc_initializeFolderTree.renderer!.trigger({ folders });
    return result;
  },
  async selectTreeFolder(folderPath: string) {
    const { result } = await ipc_selectTreeFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async calculateGameStats(filePath: string) {
    const { result } = await ipc_calculateGameStats.renderer!.trigger({ filePath });
    return result;
  },
  async computeStatsCache() {
    await ipc_computeStatsCache.renderer!.trigger({});
  },
  async getGlobalStatsStatus() {
    return await ipc_getStatsStatus.renderer!.trigger({});
  },
  onReplayLoadProgressUpdate(handle: (progress: Progress) => void) {
    const { destroy } = ipc_loadProgressUpdatedEvent.renderer!.handle(async (progress) => {
      handle(progress);
    });
    return destroy;
  },
  onStatsProgressUpdate(handle: (progress: Progress) => void) {
    const { destroy } = ipc_statsProgressUpdatedEvent.renderer!.handle(async (progress) => {
      handle(progress);
    });
    return destroy;
  },
  onStatsPageRequest(handle: (filePath: string) => void) {
    const { destroy } = ipc_statsPageRequestedEvent.renderer!.handle(async ({ filePath }) => {
      handle(filePath);
    });
    return destroy;
  },
};
