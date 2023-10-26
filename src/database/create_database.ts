import DatabaseConstructor from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

export async function createDatabase(databasePath: string): Promise<Kysely<Database>> {
  const dialect = new SqliteDialect({
    database: new DatabaseConstructor(databasePath),
  });

  const database = new Kysely<Database>({
    dialect,
  });

  await migrateToLatest(database);
  return database;
}
