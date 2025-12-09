import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import type { MigrationProvider } from "kysely";
import { Kysely, SqliteDialect } from "kysely";

import webpackPaths from "../../../.erb/configs/webpack.paths";
import { migrateToLatest } from "../migrate_to_latest";
import { ESMCompatibleMigrationProvider } from "./esm_migration_provider";

export async function initTestDb(): Promise<Kysely<Database>> {
  const sqliteDb = new Sqlite(":memory:");
  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  // Use dist path so we can test against prod productions
  const migrationFolder = webpackPaths.distMigrationsPath;
  let provider: MigrationProvider | undefined;
  if (process.platform === "win32") {
    // We need special handling of file paths in Windows
    provider = new ESMCompatibleMigrationProvider(migrationFolder);
  }
  await migrateToLatest(database, webpackPaths.distMigrationsPath, { customProvider: provider });
  return database;
}
