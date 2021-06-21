import { calculateGameStats, loadProgressUpdated, loadReplayFolder } from "./ipc";
import { worker as replayBrowserWorker } from "./workerInterface";

loadReplayFolder.main!.handle(async ({ folderPath }) => {
  const w = await replayBrowserWorker;
  w.getProgressObservable().subscribe((progress) => {
    loadProgressUpdated.main!.trigger(progress);
  });
  const result = await w.loadReplayFolder(folderPath);
  return result;
});

calculateGameStats.main!.handle(async ({ filePath }) => {
  const w = await replayBrowserWorker;
  const result = await w.calculateGameStats(filePath);
  return { stats: result };
});
