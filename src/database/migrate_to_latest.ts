import { promises as fs } from "fs";
import type { Kysely, Migration, MigrationProvider, MigrationResult } from "kysely";
import { Migrator } from "kysely";
import path from "path";
import { pathToFileURL } from "url";

import type { Database } from "./schema";

/**
 * Converts an absolute path to a file:// URL on Windows for ESM compatibility.
 *
 * On Windows, Node.js ESM loader requires absolute paths to be valid file:// URLs
 * when using dynamic imports. Without this conversion, you'll get:
 * `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data,
 * node, and electron are supported by the default ESM loader. On Windows, absolute
 * paths must be valid file:// URLs. Received protocol 'd:'`
 *
 * This function ensures cross-platform compatibility by converting Windows absolute
 * paths (e.g., `D:\path\to\migrations`) to file:// URLs (e.g., `file:///D:/path/to/migrations`)
 * while leaving relative paths and non-Windows paths unchanged.
 *
 * @param filePath - The absolute file path to convert
 * @returns The path converted to a file:// URL if absolute, otherwise unchanged
 */
function fixPathForESMImport(filePath: string): string {
  return path.isAbsolute(filePath) ? pathToFileURL(filePath).href : filePath;
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

      // Convert to file:// URL for Windows ESM compatibility
      const importPath = fixPathForESMImport(filePath);

      // Dynamic import of the migration module
      const migration = await import(importPath);
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
