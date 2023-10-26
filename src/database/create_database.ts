import DatabaseConstructor from "better-sqlite3";
import log from "electron-log";
import { Kysely, SqliteDialect } from "kysely";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

export async function createDatabase(databasePath: string): Promise<Kysely<Database>> {
  log.info(`opening database at: ${databasePath}`);
  const dialect = new SqliteDialect({
    database: new DatabaseConstructor(databasePath),
  });

  const database = new Kysely<Database>({
    dialect,
  });

  log.info("running migrations");
  await migrateToLatest(database);
  log.info("successfully ran migrations");
  return database;
}
