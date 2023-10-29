import { app } from "electron";
import log from "electron-log";
import { Kysely } from "kysely";
import { SqliteWorkerDialect } from "kysely-sqlite-worker";
import path from "path";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

export async function createDatabase(databasePath?: string): Promise<Kysely<Database>> {
  let source: string;
  if (databasePath) {
    log.info(`Opening database at: ${databasePath}`);
    source = databasePath;
  } else {
    log.info(`Database path not provided. Using in-memory SQLite database`);
    source = ":memory:";
  }

  const database = new Kysely<Database>({
    dialect: new SqliteWorkerDialect({
      source,
    }),
  });

  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "./migrations")
    : path.join(__dirname, "./migrations");
  log.info(`Running migrations in ${migrationsFolder}`);

  const results = await migrateToLatest(database, migrationsFolder);
  results.forEach((result) => {
    if (result.status === "Success") {
      log.info(`Migration "${result.migrationName}" was executed successfully`);
    } else if (result.status === "Error") {
      log.error(`Failed to execute migration: "${result.migrationName}"`);
    }
  });

  log.info("Successfully ran migrations");
  return database;
}
