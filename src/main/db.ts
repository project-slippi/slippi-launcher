import { FileResult } from "common/replayBrowser/types";
import { app, ipcMain } from "electron";
import Nedb from "nedb-promises-ts";
import path from "path";

const db = new Nedb<FileResult>({ autoload: true, filename: path.join(app.getPath("userData"), "statsDB") });

const loadReplays = async (folder: string) => {
  const res = await db.find({ folder: folder }).sort({ timestamp: 1 });
  return Array.from(res.values());
};

const saveReplay = async (replayFile: FileResult) => {
  await db.insert(replayFile);
  console.log(`inserted ${replayFile.fullPath} to the db`);
  return null;
};

const deleteReplays = async (filesToDelete: string[]) => {
  await db.remove({ fullPath: { $in: filesToDelete } }, { multi: true });
  return null;
};

ipcMain.on("load-replays", async (event, folder) => {
  try {
    event.reply("load-replays", await loadReplays(folder));
  } catch (err) {
    event.reply("load-replays", err);
  }
});

ipcMain.on("save-replay", async (event, replay) => {
  try {
    event.reply("save-replay", await saveReplay(replay));
  } catch (err) {
    event.reply("save-replay", err);
  }
});

ipcMain.on("delete-replays", async (event, replays) => {
  try {
    event.reply("delete-replays", await deleteReplays(replays));
  } catch (err) {
    event.reply("delete-replays", err);
  }
});
