import { FileLoadResult, loadFolder } from "common/replayBrowser";

export async function loadReplayFolder(
  folder: string,
  callback: (current: number, total: number) => void
): Promise<FileLoadResult> {
  return loadFolder(folder, callback);
}
