import Sqlite from "better-sqlite3";
import { app } from "electron";
import log from "electron-log";
import fs from "fs-extra";
import { Kysely, sql } from "kysely";
import { SqliteWorkerDialect } from "kysely-sqlite-worker";
import path from "path";

import { migrateToLatest } from "./migrate_to_latest";
import type { Database } from "./schema";

/** The latest database schema version.
 *  Only increment this when we want users to re-create the database from scratch.
 */
const DATABASE_USER_VERSION = 0;

export async function createDatabase(databasePath?: string): Promise<Kysely<Database>> {
  try {
    const database = await initDatabaseAndRunMigrations(databasePath);
    return database;
  } catch (err) {
    log.warn(`Error creating database: ${err}. Force retrying...`);
  }

  return await initDatabaseAndRunMigrations(databasePath, { force: true });
}

async function initDatabaseAndRunMigrations(
  databasePath?: string,
  { force }: { force?: boolean } = {},
): Promise<Kysely<Database>> {
  let source: string;
  if (databasePath) {
    log.info(`Using database at: ${databasePath}`);
    const userVersion = getDatabaseUserVersion(databasePath);

    // If we couldn't read the version (corrupted database) or version mismatch, recreate
    if (userVersion === null) {
      log.warn(`Database is corrupted or unreadable. Recreating database.`);
      await backupAndRecreateDatabase(databasePath);
    } else {
      log.info(`Current database user version is ${userVersion}. Latest version is ${DATABASE_USER_VERSION}.`);
      if (userVersion !== DATABASE_USER_VERSION || force) {
        await backupAndRecreateDatabase(databasePath);
      }
    }
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

  // Enable foreign keys for SQLite (required on some platforms like Ubuntu)
  await sql`PRAGMA foreign_keys = ON`.execute(database);
  log.info("Enabled foreign key constraints");

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

function getDatabaseUserVersion(databasePath: string): number | null {
  try {
    const sqliteDb = new Sqlite(databasePath);
    const userVersion = sqliteDb.pragma("user_version", { simple: true }) as number;
    sqliteDb.close();
    return userVersion;
  } catch (err) {
    log.warn(`Failed to read database version from ${databasePath}. Database may be corrupted: ${err}`);
    return null;
  }
}

async function backupAndRecreateDatabase(databasePath: string) {
  // We want to hard-reset/re-index the database
  const backupDatabasePath = databasePath + ".bak";
  log.info(`Backing up database to: ${backupDatabasePath}`);

  try {
    // Delete the existing backup if necessary
    await fs.rm(backupDatabasePath, { force: true });

    // Rename the current database
    await fs.rename(databasePath, backupDatabasePath);
  } catch (err) {
    log.warn(`Failed to backup database: ${err}. Attempting to delete and recreate without backup.`);
    try {
      // If we can't backup, just delete the corrupted database
      await fs.rm(databasePath, { force: true });
    } catch (deleteErr) {
      log.error(`Failed to delete corrupted database: ${deleteErr}`);
      throw new Error(`Unable to recreate database. Please manually delete: ${databasePath}`);
    }
  }

  // Create a new db with the latest user_version
  try {
    const newSqliteDb = new Sqlite(databasePath);
    newSqliteDb.pragma(`user_version = ${DATABASE_USER_VERSION}`);
    newSqliteDb.close();
  } catch (err) {
    log.error(`Failed to create new database: ${err}`);
    throw new Error(`Unable to create new database at: ${databasePath}`);
  }
}
