import SQLite from "better-sqlite3";
import log from "electron-log";
import { Kysely, SqliteDialect } from "kysely";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

export async function createDatabase(databasePath?: string): Promise<Kysely<Database>> {
  let sqliteDb: SQLite.Database;
  if (databasePath) {
    log.info(`Opening database at: ${databasePath}`);
    sqliteDb = new SQLite(databasePath);
  } else {
    log.info(`Database path not provided. Using in-memory SQLite database`);
    sqliteDb = new SQLite(":memory:");
  }

  const dialect = new SqliteDialect({
    database: sqliteDb,
  });

  const database = new Kysely<Database>({
    dialect,
  });

  log.info("Running migrations");
  await migrateToLatest(database);
  log.info("Successfully ran migrations");
  return database;
}
