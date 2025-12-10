/* eslint-disable import/no-default-export */
import {
  ipc_bulkDeleteReplays,
  ipc_calculateGameStats,
  ipc_calculateStadiumStats,
  ipc_deleteReplays,
  ipc_getAllFilePaths,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_searchGames,
  ipc_selectTreeFolder,
  ipc_statsPageRequestedEvent,
} from "./ipc";
import type { BulkDeleteOptions, Progress, ReplayService, SearchGamesOptions } from "./types";

const replayApi: ReplayService = {
  async initializeFolderTree(folders: readonly string[]) {
    const { result } = await ipc_initializeFolderTree.renderer!.trigger({ folders });
    return result;
  },
  async selectTreeFolder(folderPath: string) {
    const { result } = await ipc_selectTreeFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async searchGames(options: SearchGamesOptions) {
    const { result } = await ipc_searchGames.renderer!.trigger(options);
    return result;
  },
  async getAllFilePaths(options: SearchGamesOptions) {
    const { result } = await ipc_getAllFilePaths.renderer!.trigger(options);
    return result;
  },
  async calculateGameStats(filePath: string) {
    const { result } = await ipc_calculateGameStats.renderer!.trigger({ filePath });
    return result;
  },
  async calculateStadiumStats(filePath: string) {
    const { result } = await ipc_calculateStadiumStats.renderer!.trigger({ filePath });
    return result;
  },
  async deleteReplays(fileIds: string[]) {
    await ipc_deleteReplays.renderer!.trigger({ fileIds });
  },
  async bulkDeleteReplays(options: BulkDeleteOptions) {
    const { result } = await ipc_bulkDeleteReplays.renderer!.trigger(options);
    return result;
  },
  onReplayLoadProgressUpdate(handle: (progress: Progress) => void) {
    const { destroy } = ipc_loadProgressUpdatedEvent.renderer!.handle(async (progress) => {
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

export default replayApi;
