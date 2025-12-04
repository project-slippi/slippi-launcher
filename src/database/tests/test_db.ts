import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";

export async function initTestDb(): Promise<Kysely<Database>> {
  // Each call creates a completely fresh in-memory database
  // SQLite's :memory: creates a new database for each connection
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

export async function resetTestDb(db: Kysely<Database>) {
  // Delete all data from tables in correct order (respecting foreign key constraints)
  // Cascading deletes would handle this automatically, but explicit order is clearer
  await db.deleteFrom("player").execute();
  await db.deleteFrom("game").execute();
  await db.deleteFrom("file").execute();

  // Note: We don't reset sqlite_sequence because:
  // 1. Auto-incrementing IDs across tests is fine (tests shouldn't rely on specific IDs)
  // 2. Deleting from sqlite_sequence can break unique constraints when running tests sequentially
}

export async function closeTestDb(db: Kysely<Database>) {
  await db.destroy();
}
