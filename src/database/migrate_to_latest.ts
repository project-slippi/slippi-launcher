import { promises as fs } from "fs";
import type { Kysely, Migration, MigrationProvider, MigrationResult } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";
import { pathToFileURL } from "url";

import type { Database } from "./schema";

/**
 * Converts a file path to the appropriate format for dynamic imports.
 *
 * This function handles the difference between development and production environments:
 * - Development (ts-node): Uses regular file paths (importing .ts files)
 * - Production (compiled): Uses file:// URLs for absolute paths (importing .js files)
 *
 * On Windows with ESM, absolute paths must be valid file:// URLs or you'll get:
 * `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data,
 * node, and electron are supported by the default ESM loader. Received protocol 'd:'`
 *
 * We detect the environment by checking if we're importing .js files (production)
 * or .ts files (development with ts-node).
 *
 * @param filePath - The file path to convert
 * @returns The path in the appropriate format for the current environment
 */
function fixPathForImport(filePath: string): string {
  // In development with ts-node, we import .ts files directly - use regular paths
  if (filePath.endsWith(".ts")) {
    return filePath;
  }

  // In production, we import compiled .js files - use file:// URLs for absolute paths
  // This ensures Windows ESM compatibility while still working on Unix systems
  if (path.isAbsolute(filePath)) {
    return pathToFileURL(filePath).href;
  }

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

export async function migrateToLatest(db: Kysely<Database>, migrationFolder: string): Promise<MigrationResult[]> {
  // Auto-detect which provider to use based on what migration files exist:
  // - .ts files present → Development/tests (use dynamic import with ESM provider)
  // - Only .js files → Production build (use require with FileMigrationProvider)
  //
  // This is simpler and more reliable than checking app.isPackaged because:
  // - Works correctly in test environments where Electron app may not be initialized
  // - Directly detects the actual file format rather than inferring from app state
  // - Self-documenting: the check matches what actually matters
  const files = await fs.readdir(migrationFolder);
  const hasTsFiles = files.some((f) => f.endsWith(".ts"));

  let provider: MigrationProvider;
  if (hasTsFiles) {
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
