import { promises as fs } from "fs";
import type { Kysely, MigrationResult } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";

import type { Database } from "./schema";

export async function migrateToLatest(db: Kysely<Database>, migrationFolder: string): Promise<MigrationResult[]> {
  console.log(`migrating to latest with migration folder: ${migrationFolder}`);
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();
  if (error || !results) {
    throw new Error(`Error migrating database: ${error}`);
  }

  return results;
}
