import { ipc_loadReplayFolder, ipc_loadReplayFiles, ipc_calculateGameStats, ipc_loadProgressUpdatedEvent } from "./ipc";
import { worker as replayBrowserWorker } from "./workerInterface";

ipc_loadReplayFolder.main!.handle(async ({ folderPath }) => {
  const w = await replayBrowserWorker;
  w.getProgressObservable().subscribe((progress) => {
    ipc_loadProgressUpdatedEvent.main!.trigger(progress).catch(console.warn);
  });
  return await w.loadReplayFolder(folderPath);
});

ipc_loadReplayFiles.main!.handle(async ({ fileHeaders, batcherId }) => {
  const w = await replayBrowserWorker;
  await w.loadReplayFiles(fileHeaders, batcherId);
  return {};
});

ipc_calculateGameStats.main!.handle(async ({ filePath }) => {
  const w = await replayBrowserWorker;
  const [statsResult, fileResult] = await Promise.all([w.calculateGameStats(filePath), w.loadSingleFile(filePath)]);
  return { file: fileResult, stats: statsResult };
});
