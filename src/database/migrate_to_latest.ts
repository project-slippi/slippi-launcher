import { promises as fs } from "fs";
import type { Kysely, Migration, MigrationProvider, MigrationResult } from "kysely";
import { Migrator } from "kysely";
import path from "path";
import { pathToFileURL } from "url";

import type { Database } from "./schema";

/**
 * Attempts to import a migration file with proper path handling for both CJS and ESM.
 *
 * This function handles two scenarios:
 * 1. Development (ts-node/CommonJS): Uses regular file paths with dynamic import
 * 2. Production (ESM on Windows): Converts absolute paths to file:// URLs
 *
 * On Windows with ESM, absolute paths must be valid file:// URLs or you'll get:
 * `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data,
 * node, and electron are supported by the default ESM loader. Received protocol 'd:'`
 *
 * @param filePath - The absolute file path to import
 * @returns The imported migration module
 */
async function importMigration(filePath: string): Promise<Migration> {
  try {
    // First try with regular path (works in dev/CJS and Unix ESM)
    return await import(filePath);
  } catch (error: any) {
    // If it fails with ERR_UNSUPPORTED_ESM_URL_SCHEME (Windows ESM), try with file:// URL
    if (error?.code === "ERR_UNSUPPORTED_ESM_URL_SCHEME" && path.isAbsolute(filePath)) {
      const fileUrl = pathToFileURL(filePath).href;
      return await import(fileUrl);
    }
    throw error;
  }
}

/**
 * Custom migration provider that handles Windows ESM paths correctly.
 *
 * This provider is necessary because Kysely's FileMigrationProvider doesn't convert
 * absolute paths to file:// URLs before doing dynamic imports, which causes errors
 * on Windows when using ESM.
 */
class ESMCompatibleMigrationProvider implements MigrationProvider {
  constructor(private readonly migrationFolder: string) {}

  public async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    const files = await fs.readdir(this.migrationFolder);

    // Sort files alphabetically to ensure migrations run in chronological order
    // (migration filenames are prefixed with timestamps like 20231030T2041_)
    files.sort();

    for (const fileName of files) {
      if (!fileName.endsWith(".ts") && !fileName.endsWith(".js")) {
        continue;
      }

      const migrationName = fileName.substring(0, fileName.lastIndexOf("."));
      const filePath = path.join(this.migrationFolder, fileName);

      // Import with automatic CJS/ESM handling
      const migration = await importMigration(filePath);
      migrations[migrationName] = migration;
    }

    return migrations;
  }
}

export async function migrateToLatest(db: Kysely<Database>, migrationFolder: string): Promise<MigrationResult[]> {
  const migrator = new Migrator({
    db,
    provider: new ESMCompatibleMigrationProvider(migrationFolder),
  });

  const { error, results } = await migrator.migrateToLatest();
  if (error || !results) {
    throw new Error(`Error migrating database: ${error}`);
  }

  return results;
}
