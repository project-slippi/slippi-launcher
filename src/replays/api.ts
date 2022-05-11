/* eslint-disable import/no-default-export */
import {
  ipc_calculateGameStats,
  ipc_fileLoadCompleteEvent,
  ipc_fileLoadErrorEvent,
  ipc_initializeFolderTree,
  ipc_loadProgressUpdatedEvent,
  ipc_loadReplayFiles,
  ipc_loadReplayFolder,
  ipc_selectTreeFolder,
  ipc_statsPageRequestedEvent,
} from "./ipc";
import type { FileLoadComplete, FileLoadError, Progress } from "./types";

export default {
  async loadReplayFolder(folderPath: string) {
    const { result } = await ipc_loadReplayFolder.renderer!.trigger({ folderPath });
    return result;
  },
  async loadReplayFiles(fileHeaders: FileHeader[], batcherId: number) {
    const { result } = await ipc_loadReplayFiles.renderer!.trigger({ fileHeaders: fileHeaders, batcherId: batcherId });
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
  onReplayLoadProgressUpdate(handle: (progress: Progress) => void) {
    const { destroy } = ipc_loadProgressUpdatedEvent.renderer!.handle(async (progress) => {
      handle(progress);
    });
    return destroy;
  },
  onFileLoadComplete(handle: (fileLoadComplete: FileLoadComplete) => void) {
    const { destroy } = ipc_fileLoadCompleteEvent.renderer!.handle(async (fileLoadComplete) => {
      handle(fileLoadComplete);
    });
    return destroy;
  },
  onFileLoadError(handle: (fileLoadError: FileLoadError) => void) {
    const { destroy } = ipc_fileLoadErrorEvent.renderer!.handle(async (fileLoadError) => {
      handle(fileLoadError);
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
