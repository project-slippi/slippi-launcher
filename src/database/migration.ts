import { promises as fs } from "fs";
import type { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import * as path from "path";

import type { Database } from "./types"; // schema

// Function taken from https://kysely.dev/docs/migrations
export async function migrateToLatest(db: Kysely<Database>) {
  const migrationFolder = path.join(__dirname, "/migrations");
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: migrationFolder,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }
}
