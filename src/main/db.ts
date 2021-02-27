import SlippiGame, { StatsType } from "@slippi/slippi-js";
import { FileResult } from "common/replayBrowser/types";
import { app, ipcMain } from "electron";
import path from "path";
import * as sqlite3 from "sqlite3";

const db = new sqlite3.Database(path.join(app.getPath("userData"), "statsdb.sqlite"), (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the replay database.");
});

db.run(`
CREATE TABLE IF NOT EXISTS replays (
     fullPath      TEXT PRIMARY KEY,
     name          TEXT,
     folder        TEXT,
     startTime     TEXT,
     lastFrame     INTEGER,
     playerCount   INTEGER,
     player1       INTEGER,
     player2       INTEGER,
     player3       INTEGER,
     player4       INTEGER,
     settings      JSON,
     metadata      JSON,
     stats         JSON)
`);

db.run("CREATE INDEX IF NOT EXISTS folder_idx  ON replays(folder)");
db.run("CREATE INDEX IF NOT EXISTS player1_idx ON replays(player1)");
db.run("CREATE INDEX IF NOT EXISTS player2_idx ON replays(player2)");
db.run("CREATE INDEX IF NOT EXISTS player3_idx ON replays(player3)");
db.run("CREATE INDEX IF NOT EXISTS player4_idx ON replays(player4)");

const parseRow = (row: any) => {
  return {
    name: row.name,
    fullPath: row.fullPath,
    settings: JSON.parse(row.settings),
    startTime: row.startTime,
    lastFrame: row.lastFrame,
    metadata: JSON.parse(row.metadata),
    stats: JSON.parse(row.stats || null),
    playerCount: row.playerCount,
    player1: row.player1,
    player2: row.player2,
    player3: row.player3,
    player4: row.player4,
    folder: row.folder,
  } as FileResult;
};

ipcMain.on("load-replays", async (event, folder) => {
  db.all(
    `
    SELECT fullPath, name, folder, startTime, lastFrame, 
    playerCount, player1, player2, player3, player4, 
    settings, metadata 
    FROM replays 
    WHERE folder in (?)
    ORDER by startTime DESC`,
    [folder],
    (err, docs) => {
      if (err) {
        event.reply("load-replays", err);
      } else {
        const files = docs.map(parseRow);
        event.reply("load-replays", docs ? files : []);
      }
    },
  );
});

ipcMain.on("load-replay-file", async (event, file) => {
  db.all("SELECT * from replays WHERE fullPath = ?", [file], (err, docs) => {
    if (err) {
      event.reply("load-replay-file", err);
    } else {
      const files = docs.map(parseRow);
      event.reply("load-replay-file", docs ? files[0] : null);
    }
  });
});

ipcMain.on("load-player-replays", async (event, player) => {
  db.all("SELECT * from replays WHERE (?) IN (player1, player2, player3, player4)", [player], (err, docs) => {
    if (err) {
      event.reply("load-player-replays", err);
    } else {
      event.reply("load-player-replays", docs);
    }
  });
});

ipcMain.on("save-replay", async (event, replay) => {
  const game = new SlippiGame(replay.fullPath);
  const stats: StatsType | null = game.getStats();
  if (stats) {
    replay.stats = stats;
  }
  db.run(
    `INSERT INTO replays(
    fullPath, name ,folder, startTime, lastFrame, 
    playerCount, player1, player2, player3, player4, 
    settings, metadata, stats)
    VALUES (?, ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, ?)
   `,
    [
      replay.fullPath,
      replay.name,
      replay.folder,
      replay.startTime,
      replay.lastFrame,
      replay.playerCount,
      replay.player1,
      replay.player2,
      replay.player3,
      replay.player4,
      JSON.stringify(replay.settings),
      JSON.stringify(replay.metadata),
      JSON.stringify(replay.stats),
    ],
    (err) => {
      if (err) {
        event.reply("save-replay", err);
      } else {
        event.reply("save-replay", null);
      }
    },
  );
});

ipcMain.on("delete-replays", async (event, replays) => {
  db.run("DELETE FROM replays WHERE fullPath IN (?)", replays, (err) => {
    if (err) {
      event.reply("delete-replays", err);
    } else {
      event.reply("delete-replays", null);
    }
  });
});

ipcMain.on("delete-folders", async (event, existingFolders) => {
  db.run("DELETE FROM replays WHERE folder IN (?)", [existingFolders], (err) => {
    if (err) {
      event.reply("delete-folders", err);
    } else {
      event.reply("delete-folders", null);
    }
  });
});
