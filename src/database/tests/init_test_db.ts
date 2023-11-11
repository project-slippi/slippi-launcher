import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";

export async function initTestDb(): Promise<Kysely<Database>> {
  const sqliteDb = new Sqlite(":memory:");
  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  const migrationsFolder = path.join(__dirname, "../migrations");
  await migrateToLatest(database, migrationsFolder);
  return database;
}
