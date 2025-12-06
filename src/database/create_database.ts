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

/**
 * Apply SQLite PRAGMA settings for optimal performance.
 * These settings significantly improve bulk insert and query performance.
 */
async function applyPragmaSettings(db: Kysely<Database>): Promise<void> {
  log.info("Applying SQLite PRAGMA settings for performance optimization");

  try {
    // Enable WAL mode for better concurrency and write performance
    // WAL allows concurrent reads during writes and is faster than rollback journal
    await sql`PRAGMA journal_mode = WAL`.execute(db);
    log.info("Enabled WAL journal mode");

    // NORMAL synchronous mode - balance between safety and performance
    // Full is safest but slowest, OFF is fastest but unsafe, NORMAL is the sweet spot
    await sql`PRAGMA synchronous = NORMAL`.execute(db);
    log.info("Set synchronous mode to NORMAL");

    // Increase cache size to 64MB (default is ~2MB)
    // Negative value means size in KB, positive means number of pages
    // -64000 = 64MB of cache
    await sql`PRAGMA cache_size = -64000`.execute(db);
    log.info("Set cache size to 64MB");

    // Store temp tables and indices in memory for faster operations
    await sql`PRAGMA temp_store = MEMORY`.execute(db);
    log.info("Set temp store to memory");

    // Use 8KB page size (SQLite 3.12.0+ default is 4KB)
    // Larger page size can improve performance for larger databases
    // Note: This only takes effect on new databases or after VACUUM
    await sql`PRAGMA page_size = 8192`.execute(db);
    log.info("Set page size to 8KB");

    log.info("Successfully applied all PRAGMA settings");
  } catch (err) {
    // Don't fail database creation if PRAGMA settings fail
    // Log the error and continue - database will still work, just not optimally
    log.warn(`Failed to apply some PRAGMA settings: ${err}`);
  }
}

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

  // Apply performance optimizations via PRAGMA settings
  await applyPragmaSettings(database);

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
