import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import { Kysely, sql, SqliteDialect } from "kysely";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";

export async function initTestDb(): Promise<Kysely<Database>> {
  const sqliteDb = new Sqlite(":memory:");

  // Enable foreign keys BEFORE creating Kysely instance (required on some platforms like Ubuntu)
  sqliteDb.pragma("foreign_keys = ON");

  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  // Verify foreign keys are enabled
  const result = await sql<{ foreign_keys: number }>`PRAGMA foreign_keys`.execute(database);
  if (result.rows[0]?.foreign_keys !== 1) {
    throw new Error("Failed to enable foreign keys");
  }

  const migrationsFolder = path.join(__dirname, "../migrations");
  await migrateToLatest(database, migrationsFolder);
  return database;
}

export async function resetTestDb(db: Kysely<Database>) {
  await db.deleteFrom("file").execute();
  await db.deleteFrom("game").execute();
  await db.deleteFrom("player").execute();
}
