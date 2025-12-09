import { promises as fs } from "fs";
import type { Kysely, MigrationProvider, MigrationResult } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";

import type { Database } from "./schema";

export async function migrateToLatest(
  db: Kysely<Database>,
  migrationFolder: string,
  options?: { customProvider?: MigrationProvider },
): Promise<MigrationResult[]> {
  let provider: MigrationProvider;
  if (options?.customProvider) {
    provider = options.customProvider;
  } else {
    provider = new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    });
  }

  const migrator = new Migrator({ db, provider });

  const { error, results } = await migrator.migrateToLatest();
  if (error || !results) {
    throw new Error(`Error migrating database: ${error}`);
  }

  return results;
}
