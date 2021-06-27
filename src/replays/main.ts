import { ipc_calculateGameStats, ipc_loadProgressUpdatedEvent, ipc_loadReplayFolder } from "./ipc";
import { worker as replayBrowserWorker } from "./workerInterface";

ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
  const w = await replayBrowserWorker;
  w.getProgressObservable().subscribe((progress) => {
    ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
  });
  const result = await w.loadReplayFolder(folderPath);
  return result;
});

ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
  const w = await replayBrowserWorker;
  const result = await w.calculateGameStats(filePath);
  const fileResult = await w.loadSingleFile(filePath);
  return { file: fileResult, stats: result };
});
