import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import webpackPaths from "../../../.erb/configs/webpack.paths";
import { migrateToLatest } from "../migrate_to_latest";

export async function initTestDb(): Promise<Kysely<Database>> {
  const sqliteDb = new Sqlite(":memory:");
  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  await migrateToLatest(database, webpackPaths.distMigrationsPath);
  return database;
}

export async function resetTestDb(db: Kysely<Database>) {
  await db.deleteFrom("file").execute();
  await db.deleteFrom("game").execute();
  await db.deleteFrom("player").execute();
}
