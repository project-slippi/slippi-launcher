// NOTE: This module cannot use electron-log, since it for some reason
// fails to obtain the paths required for file transport to work
// when in Node worker context.

// TODO: Make electron-log work somehow
import Database from "better-sqlite3";
import _ from "lodash";
import path from "path";
import type { ModuleMethods } from "threads/dist/types/master";
import { expose } from "threads/worker";

import type { FileResult } from "./types";

export interface Methods {
  dispose(): Promise<void>;
  connect(path: string): void;
  getFolderFiles(folder: string): Promise<string[]>;
  getFolderReplays(folder: string): Promise<FileResult[]>;
  getFullReplay(file: string): Promise<FileResult | null>;
  saveReplays(replays: FileResult[]): Promise<void>;
  deleteReplays(files: string[]): Promise<void>;
  pruneFolders(existingFolders: string[]): Promise<void>;
}

export type WorkerSpec = ModuleMethods & Methods;

const createTablesSql = `
CREATE TABLE IF NOT EXISTS replays (
    fullPath      TEXT PRIMARY KEY,
    name          TEXT,
    folder        TEXT
);

CREATE INDEX IF NOT EXISTS folder_idx ON replays(folder);

CREATE TABLE IF NOT EXISTS replay_data (
    fullPath      TEXT PRIMARY KEY,
    startTime     TEXT,
    lastFrame     INTEGER,
    settings      JSON,
    metadata      JSON,
    stats         JSON,
    FOREIGN KEY (fullPath) REFERENCES replays(fullPath) ON DELETE CASCADE
);
`;

let db: Database.Database;

const parseRow = (row: any) => {
  return {
    name: row.name,
    fullPath: row.fullPath,
    settings: JSON.parse(row.settings),
    startTime: row.startTime,
    lastFrame: row.lastFrame,
    metadata: JSON.parse(row.metadata),
    stats: JSON.parse(row.stats),
    folder: row.folder,
  } as FileResult;
};

/**
 * This retrieves all the replays in a given folder and returns their full paths.
 */
const getFolderFiles = async (folder: string): Promise<string[]> => {
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

const getAllFiles = async (): Promise<string[]> => {
  const files = db
    .prepare(
      `
      SELECT fullPath
      FROM replays
      JOIN replay_data USING (fullPath)
      WHERE stats is NULL
      `,
    )
    .all();
  return files ? files.map((f: any) => f.fullPath) : [];
};

const getFolderReplays = async (folder: string) => {
  const docs = db
    .prepare(
      `
    SELECT fullPath, name, folder, startTime, lastFrame, settings, metadata, stats
    FROM replays 
    JOIN replay_data USING (fullPath)
    WHERE folder = ?
    ORDER by startTime DESC`,
    )
    .all(folder);
  const files = docs.map(parseRow);
  return docs ? files : [];
};

const getFullReplay = async (file: string) => {
  const doc = db.prepare("SELECT * from replays JOIN replay_data USING (fullPath) WHERE fullPath = ?").get(file);
  return parseRow(doc);
};

const saveReplays = async (replays: FileResult[]) => {
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

const storeStatsCache = async (replays: FileResult[]): Promise<void> => {
  db.transaction(() => {
    const update = db.prepare(`UPDATE replay_data SET stats = ? WHERE fullPath = ?`);
    replays.forEach((r) => update.run(JSON.stringify(r.stats), r.fullPath));
  })();
};

const deleteReplays = async (files: string[]) => {
  const qfmt = files.map(() => "?").join(",");
  db.prepare(`DELETE FROM replays WHERE fullPath IN (${qfmt})`).run(files);
};

const pruneFolders = async (existingFolders: string[]) => {
  const qfmt = existingFolders.map(() => "?").join(", ");
  db.prepare(`DELETE FROM replays WHERE folder NOT IN (${qfmt})`).run(existingFolders);
};

const methods: WorkerSpec = {
  async dispose() {
    // Clean up anything
    if (db) {
      db.close();
    }
  },
  disconnect() {
    db.close();
  },
  connect(path: string) {
    console.log(path);
    db = new Database(path);
    db.exec(createTablesSql);
  },
  getAllFiles,
  getFolderFiles,
  getFolderReplays,
  getFullReplay,
  saveReplays,
  deleteReplays,
  pruneFolders,
  storeStatsCache,
};

expose(methods);
