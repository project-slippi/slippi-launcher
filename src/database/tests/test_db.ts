import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import fs from "fs-extra";
import { Kysely, SqliteDialect } from "kysely";
import os from "os";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";

export async function initTestDb(): Promise<{ db: Kysely<Database>; destroy: () => Promise<void> }> {
  // Each call creates a completely fresh in-memory database
  // SQLite's :memory: creates a new database for each connection
  const randomId = Math.random().toString(16).slice(2);
  const tmpFilePath = path.join(os.tmpdir(), `${Date.now()}-slippi-launcher-test-${randomId}.sqlite`);
  const sqliteDb = new Sqlite(tmpFilePath);

  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  const migrationsFolder = path.join(__dirname, "../migrations");
  await migrateToLatest(database, migrationsFolder);

  const destroy = async () => {
    sqliteDb.close();
    await database.destroy();
    await fs.rm(tmpFilePath);
  };
  return { db: database, destroy };
}
