import {
  ipc_loadReplayFolder,
  ipc_loadReplayFiles,
  ipc_calculateGameStats,
  ipc_loadProgressUpdatedEvent,
  ipc_fileLoadCompleteEvent,
  ipc_fileLoadErrorEvent,
} from "./ipc";
import { worker as replayBrowserWorker } from "./workerInterface";

ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
  const w = await replayBrowserWorker;
  w.getProgressObservable().subscribe((progress) => {
    ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
  });
  return await w.loadReplayFolder(folderPath);
});

let hasStartedObservers = false;
ipc_loadReplayFiles.main!.handle(async ({ fileHeaders, batcherId }) => {
  const w = await replayBrowserWorker;
  // We only need to do this once. These observers never get unsubscribed, so if
  // we did it more we would leak memory.
  if (!hasStartedObservers) {
    w.getFileLoadCompleteObservable().subscribe((fileLoadComplete) => {
      ipc_fileLoadCompleteEvent.main!.trigger(fileLoadComplete).catch(console.warn);
    });
    w.getFileLoadErrorObservable().subscribe((fileLoadError) => {
      ipc_fileLoadErrorEvent.main!.trigger(fileLoadError).catch(console.warn);
    });
    hasStartedObservers = true;
  }
  w.loadReplayFiles(fileHeaders, batcherId);
  return {};
});

ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
  const w = await replayBrowserWorker;
  const [statsResult, fileResult] = await Promise.all([w.calculateGameStats(filePath), w.loadSingleFile(filePath)]);
  return { file: fileResult, stats: statsResult };
});
