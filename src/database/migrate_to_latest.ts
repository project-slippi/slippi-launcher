import { app } from "electron";
import log from "electron-log";
import { promises as fs } from "fs";
import type { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";

import type { Database } from "./schema";

export async function migrateToLatest(db: Kysely<Database>) {
  const migrationFolder = app.isPackaged
    ? path.join(process.resourcesPath, "./migrations")
    : path.join(__dirname, "./migrations");

  log.info("Applying migrations from folder: " + migrationFolder);
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === "Success") {
      log.info(`Migration "${result.migrationName}" was executed successfully`);
    } else if (result.status === "Error") {
      log.error(`Failed to execute migration: "${result.migrationName}"`);
    }
  });

  if (error || !results) {
    throw new Error(`Error migrating database: ${error}`);
  }
}
