import SlippiGame, { StatsType } from "@slippi/slippi-js";
import { FileResult } from "common/replayBrowser/types";
import { app, ipcMain } from "electron";
import Nedb from "nedb";
import path from "path";

const db = new Nedb<FileResult>({
  filename: path.join(app.getPath("userData"), "statsDB"),
  autoload: true,
});

db.ensureIndex({ fieldName: "fullPath", unique: true });
db.ensureIndex({ fieldName: "folder" });

ipcMain.on("load-replays", async (event, folder) => {
  db.find({ folder: folder })
    .sort({ timestamp: 1 })
    .exec((err, docs) => {
      if (err) {
        event.reply("load-replays", err);
      }
      event.reply("load-replays", docs);
    });
});

ipcMain.on("save-replay", async (event, replay) => {
  const game = new SlippiGame(replay.fullPath);
  const stats: StatsType | null = game.getStats();
  if (stats) {
    replay.stats = stats;
  }
  db.insert(replay, (err) => {
    if (err) {
      event.reply("save-replay", err);
    }
    event.reply("save-replay", null);
  });
});

ipcMain.on("delete-replays", async (event, replays) => {
  db.remove({ fullPath: { $in: replays } }, { multi: true }, (err) => {
    if (err) {
      event.reply("delete-replays", err);
    }
    event.reply("delete-replays", null);
  });
});

ipcMain.on("delete-folders", async (event, existingFolders) => {
  db.remove({ $not: { folder: { $in: existingFolders } } }, { multi: true }, (err) => {
    if (err) {
      event.reply("delete-folders", err);
    }
    event.reply("delete-folders", null);
  });
});
