import { FileDetails, FileHeader, loadFiles } from "common/replayBrowser";

export async function loadReplayFiles(
  fileHeaders: FileHeader[],
  callback: (path: string, details: FileDetails) => void,
  errorCallback: (path: string, err: Error) => void,
): Promise<void> {
  return loadFiles(fileHeaders, callback, errorCallback);
}
