import SQLite from "better-sqlite3";
import log from "electron-log";
import { Kysely, SqliteDialect } from "kysely";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

export async function createDatabase(databasePath: string): Promise<Kysely<Database>> {
  let sqliteDb: SQLite.Database;
  if (isDevelopment) {
    sqliteDb = new SQLite(":memory:");
  } else {
    log.info(`Opening database at: ${databasePath}`);
    sqliteDb = new SQLite(databasePath);
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
