// eslint-disable-next-line import/no-named-as-default
import Database from "better-sqlite3";
import { FileResult } from "common/types";
import path from "path";

import createTablesSql from "./sql/create.sql";

let db: Database.Database;

export const connect = (path: string) => {
  db = new Database(path);
  db.exec(createTablesSql);
};

const parseRow = (row: any) => {
  return {
    name: row.name,
    fullPath: row.fullPath,
    settings: JSON.parse(row.settings),
    startTime: row.startTime,
    lastFrame: row.lastFrame,
    metadata: JSON.parse(row.metadata),
    stats: JSON.parse(row.stats || null),
    folder: row.folder,
  } as FileResult;
};

export const getFolderFiles = async (folder: string) => {
  const files = db
    .prepare(
      `
      SELECT fullPath
      FROM replays 
      WHERE folder = ?`,
    )
    .all(folder);
  return files ? files.map((f: any) => f.fullPath) : [];
};

export const getFolderReplays = async (folder: string) => {
  const docs = db
    .prepare(
      `
    SELECT fullPath, name, folder, startTime, lastFrame, 
    settings, metadata 
    FROM replays 
    JOIN replay_data USING (fullPath)
    WHERE folder = ?
    ORDER by startTime DESC`,
    )
    .all(folder);
  const files = docs.map(parseRow);
  return docs ? files : [];
};

export const getFullReplay = async (file: string) => {
  const doc = db.prepare("SELECT * from replays JOIN replay_data USING (fullPath) WHERE fullPath = ?").get(file);
  return parseRow(doc);
};

export const getPlayerReplays = async (_: string) => {
  // return new Promise((resolve, reject) =>
  //   db.all("SELECT * from replays WHERE (?) IN (player1, player2, player3, player4)", [player], (err, docs) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       const files = docs.map(parseRow);
  //       resolve(docs ? files[0] : []);
  //     }
  //   }),
  // );
};

export const saveReplays = async (replays: FileResult[]) => {
  db.transaction(() => {
    let insert = db.prepare(`INSERT INTO replays(fullPath, name, folder) VALUES (?, ?, ?)`);
    const docs1 = replays.map((replay: FileResult) => {
      const folder = path.dirname(replay.fullPath);
      return [replay.fullPath, replay.name, folder];
    });
    docs1.forEach((d) => insert.run(...d));

    insert = db.prepare(`
      INSERT INTO replay_data(
        fullPath, startTime, lastFrame, 
        settings, metadata)
        VALUES (?, ?, ?, ?, ?)`);
    const docs2 = replays.map((replay: FileResult) => [
      replay.fullPath,
      replay.startTime,
      replay.lastFrame,
      JSON.stringify(replay.settings),
      JSON.stringify(replay.metadata),
    ]);
    docs2.forEach((d) => insert.run(...d));
  })();
};

export const deleteReplays = async (files: string[]) => {
  const qfmt = files.map(() => "?").join(",");
  db.prepare(`DELETE FROM replays WHERE fullPath IN (${qfmt})`).run(files);
};

export const pruneFolders = async (existingFolders: string[]) => {
  const qfmt = existingFolders.map(() => "?").join(", ");
  db.prepare(`DELETE FROM replays WHERE folder NOT IN (${qfmt})`).run(existingFolders);
};
