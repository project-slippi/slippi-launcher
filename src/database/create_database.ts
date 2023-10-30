import Sqlite from "better-sqlite3";
import { app } from "electron";
import log from "electron-log";
import fs from "fs-extra";
import { Kysely } from "kysely";
import { SqliteWorkerDialect } from "kysely-sqlite-worker";
import path from "path";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

// The latest database schema version.
// Increment this when we want users to re-create the database from scratch.
const DATABASE_USER_VERSION = 0;

export async function createDatabase(databasePath?: string): Promise<Kysely<Database>> {
  let source: string;
  if (databasePath) {
    log.info(`Using database at: ${databasePath}`);
    await checkDatabaseUserVersion(databasePath);
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

async function checkDatabaseUserVersion(databasePath: string) {
  const sqliteDb = new Sqlite(databasePath);
  const userVersion = sqliteDb.pragma("user_version", { simple: true }) as number;
  log.info(`Current database user version is ${userVersion}. Latest version is ${DATABASE_USER_VERSION}.`);
  if (userVersion === DATABASE_USER_VERSION) {
    return;
  }

  // We want to hard-reset/re-index the database
  const backupDatabasePath = databasePath + ".bak";
  log.info(`Database schema is out of date. Backing up database to: ${backupDatabasePath}`);

  // Delete the existing backup if necessary
  await fs.rm(backupDatabasePath, { force: true });

  // Rename the current database
  await fs.rename(databasePath, backupDatabasePath);

  // Create a new db with the latest user_version
  const newSqliteDb = new SQLite(databasePath);
  newSqliteDb.pragma(`user_version = ${DATABASE_USER_VERSION}`);
}
