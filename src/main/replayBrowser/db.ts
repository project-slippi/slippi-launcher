import { FileResult } from "common/types";
import { Database, open } from "sqlite";
import { Database as Sql3Db } from "sqlite3";

let db: Database;

export const connect = async (path: string) => {
  // open the database
  db = await open({
    filename: path,
    driver: Sql3Db,
  });
  console.log("Connected to the replay database.");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS replays (
       fullPath      TEXT PRIMARY KEY,
       name          TEXT,
       folder        TEXT)
  `);
  await db.exec("CREATE INDEX IF NOT EXISTS folder_idx ON replays(folder)");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS replay_data (
       fullPath      TEXT PRIMARY KEY,
       startTime     TEXT,
       lastFrame     INTEGER,
       settings      JSON,
       metadata      JSON,
       stats         JSON,
       FOREIGN KEY (fullPath) REFERENCES replays(fullPath) ON DELETE CASCADE);
  `);
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
  const files = await db!.all(
    `
      SELECT fullPath
      FROM replays 
      WHERE folder = ?`,
    [folder],
  );
  return files ? files.map((f) => f.fullPath) : [];
};

export const getFolderReplays = async (folder: string) => {
  const docs = await db!.all(
    `
    SELECT fullPath, name, folder, startTime, lastFrame, 
    settings, metadata 
    FROM replays 
    JOIN replay_data USING (fullPath)
    WHERE folder = ?
    ORDER by startTime DESC`,
    [folder],
  );
  const files = docs.map(parseRow);
  return docs ? files : [];
};

export const getFullReplay = async (file: string) => {
  const doc = await db!.get("SELECT * from replays JOIN replay_data USING (fullPath) WHERE fullPath = ?", [file]);
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
  const batchSize = 100;
  const batches = Math.floor(replays.length / batchSize);
  for (let i = 0; i <= batches; i++) {
    const start = i * batchSize;
    const end = Math.min(i * batchSize + batchSize, replays.length);
    const slice = replays.slice(start, end);
    await saveReplayBatch(slice);
  }
};

const inTransaction = async (cb: () => Promise<void>) => {
  db!.exec("BEGIN");
  try {
    await cb();
    db!.exec("COMMIT");
  } catch (err) {
    db!.exec("ROLLBACK");
    throw err;
  }
};

const saveReplayBatch = async (replays: FileResult[]) => {
  await inTransaction(async () => {
    const placeholdersMeta = replays.map(() => "(?, ?, ?)").join(",");
    await db!.run(
      `
      INSERT INTO replays(
      fullPath, name, folder)
      VALUES ` + placeholdersMeta,
      replays.flatMap((replay: FileResult) => [replay.fullPath, replay.name, replay.folder]),
    );
    const placeholdersData = replays.map(() => "(?, ?, ?, ?, ?, ?)").join(",");
    await db!.run(
      `
      INSERT INTO replay_data(
      fullPath, startTime, lastFrame, 
      settings, metadata, stats)
      VALUES ` + placeholdersData,
      replays.flatMap((replay: FileResult) => [
        replay.fullPath,
        replay.startTime,
        replay.lastFrame,
        JSON.stringify(replay.settings),
        JSON.stringify(replay.metadata),
        JSON.stringify(replay.stats),
      ]),
    );
  });
};

export const deleteReplays = async (files: string[]) => {
  const qfmt = files.map(() => "?").join(",");
  await db!.run(`DELETE FROM replays WHERE fullPath IN (${qfmt})`, files);
};

export const pruneFolders = async (existingFolders: string[]) => {
  const qfmt = existingFolders.map(() => "?").join(", ");
  await db!.run(`DELETE FROM replays WHERE folder NOT IN (${qfmt})`, existingFolders);
};
