/* eslint-disable import/no-default-export */
import {
  ipc_calculateGameStats,
  ipc_calculateStadiumStats,
  ipc_deleteReplays,
  ipc_getAllFilePaths,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFolder,
  ipc_searchGames,
  ipc_selectTreeFolder,
  ipc_statsPageRequestedEvent,
} from "./ipc";
import type { Progress, ReplayService, SearchGamesOptions } from "./types";

const replayApi: ReplayService = {
  async initializeFolderTree(folders: readonly string[]) {
    const { result } = await ipc_initializeFolderTree.renderer!.trigger({ folders });
    return result;
  },
  async selectTreeFolder(folderPath: string) {
    const { result } = await ipc_selectTreeFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async loadReplayFolder(folderPath: string) {
    const { result } = await ipc_loadReplayFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async searchGames(folderPath: string, options?: SearchGamesOptions) {
    const { result } = await ipc_searchGames.renderer!.trigger({ folderPath, options });
    return result;
  },
  async getAllFilePaths(folderPath: string, options?: SearchGamesOptions) {
    const { result } = await ipc_getAllFilePaths.renderer!.trigger({ folderPath, options });
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
  async deleteReplays(gameIds: string[]) {
    await ipc_deleteReplays.renderer!.trigger({ gameIds });
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
