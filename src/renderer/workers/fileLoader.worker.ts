import { FileLoader, FileLoadResult } from "common/replayBrowser";

const fileLoader = new FileLoader();

export async function loadFolder(
  folder: string,
  callback: (current: number, total: number) => void
): Promise<FileLoadResult> {
  return fileLoader.loadFolder(folder, callback);
}

export async function abortFolderLoad(): Promise<void> {
  return fileLoader.abort();
}
