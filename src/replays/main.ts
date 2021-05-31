import { worker } from "./dbWorkerInterface";
import { calculateGameStats, loadProgressUpdated, loadReplayFolder, pruneFolders } from "./ipc";
import { loadFolder } from "./loadFolder";
import { worker as replayBrowserWorker } from "./workerInterface";

loadReplayFolder.main!.handle(async ({ folderPath }) => {
  return await loadFolder(
    folderPath,
    async (current, total) => await loadProgressUpdated.main!.trigger({ current, total }),
  );
});

pruneFolders.main!.handle(async ({ existingFolders }) => {
  const w = await worker;
  await w.pruneFolders(existingFolders);
  return { success: true };
});

calculateGameStats.main!.handle(async ({ filePath }) => {
  const w = await replayBrowserWorker;
  const result = await w.calculateGameStats(filePath);
  return result;
});
