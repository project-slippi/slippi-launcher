import { FileLoadResult, loadFolder } from "common/replayBrowser";

export async function loadReplayFolder(
  folder: string,
  loadedFiles: string[],
  callback: (current: number, total: number) => void,
): Promise<FileLoadResult> {
  return loadFolder(loadedFiles, folder, callback);
}
