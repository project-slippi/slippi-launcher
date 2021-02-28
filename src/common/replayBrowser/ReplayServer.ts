import { ipcMain } from "electron";

import { deleteReplays, getFolderReplays, getFullReplay, getPlayerReplays, pruneFolders, saveReplays } from "./dao";
import { parseReplays } from "./statsComputer";

export const startReplayServer = () => {
  console.log(ipcMain);
  ipcMain.on("load-folder-replays", async (event, folder) => {
    try {
      event.reply("load-folder-replays", await getFolderReplays(folder));
    } catch (err) {
      event.reply("load-folder-replays", err);
    }
  });

  ipcMain.on("load-replay-file", async (event, file) => {
    try {
      event.reply("load-replay-file", await getFullReplay(file));
    } catch (err) {
      event.reply("load-replay-file", err);
    }
  });

  ipcMain.on("load-player-replays", async (event, player) => {
    try {
      event.reply("load-player-replays", await getPlayerReplays(player));
    } catch (err) {
      event.reply("load-player-replays", err);
    }
  });

  ipcMain.on("save-replays", async (event, replays) => {
    try {
      const results = await parseReplays(replays, (count) => event.reply("save-replays", count));
      await saveReplays(results);
      event.reply("save-replays", null);
    } catch (err) {
      console.log(err);
      event.reply("save-replays", err);
      return;
    }
  });

  ipcMain.on("delete-replays", async (event, replays) => {
    try {
      event.reply("delete-replays", await deleteReplays(replays));
    } catch (err) {
      event.reply("delete-replays", err);
    }
  });

  ipcMain.on("delete-folders", async (event, existingFolders) => {
    try {
      event.reply("delete-folders", await pruneFolders(existingFolders));
    } catch (err) {
      event.reply("delete-folders", err);
    }
  });
};
