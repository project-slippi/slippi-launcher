import { promises as fs } from "fs";
import type { Kysely, Migration, MigrationProvider, MigrationResult } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";
import { pathToFileURL } from "url";

import type { Database } from "./schema";

/**
 * Converts a file path to the appropriate format for dynamic imports.
 *
 * On Windows, absolute paths MUST be converted to file:// URLs for dynamic imports,
 * regardless of file extension (.ts or .js). Otherwise you'll get:
 * `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data,
 * node, and electron are supported by the default ESM loader. Received protocol 'd:'`
 *
 * On Unix systems, both regular paths and file:// URLs work, but file:// URLs
 * are more consistent, so we use them for absolute paths everywhere.
 *
 * @param filePath - The file path to convert
 * @returns file:// URL for absolute paths, or the original path for relative paths
 */
function fixPathForImport(filePath: string): string {
  // Convert all absolute paths to file:// URLs for cross-platform compatibility
  // This is required on Windows and works fine on Unix systems
  if (path.isAbsolute(filePath)) {
    return pathToFileURL(filePath).href;
  }

  // Relative paths can be used as-is
  return filePath;
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

      // Convert path to appropriate format for the environment
      const importPath = fixPathForImport(filePath);

      // Dynamic import of the migration module
      const migration = await import(importPath);
      migrations[migrationName] = migration;
    }

    return migrations;
  }
}

export async function migrateToLatest(
  db: Kysely<Database>,
  migrationFolder: string,
  options?: { useEsmMigrator?: boolean },
): Promise<MigrationResult[]> {
  let provider: MigrationProvider;
  if (options?.useEsmMigrator) {
    // Development/tests: Use dynamic import() which handles ESM and cross-platform paths
    provider = new ESMCompatibleMigrationProvider(migrationFolder);
  } else {
    // Production: Use require() which works perfectly for CommonJS modules
    provider = new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    });
  }

  const migrator = new Migrator({
    db,
    provider,
  });

  const { error, results } = await migrator.migrateToLatest();
  if (error || !results) {
    throw new Error(`Error migrating database: ${error}`);
  }

  return results;
}
