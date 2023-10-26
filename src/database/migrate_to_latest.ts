import log from "electron-log";
import type { Kysely, Migration, MigrationProvider } from "kysely";
import { Migrator } from "kysely";

import migration1 from "./migrations/20230701T171646-initial";
import type { Database } from "./schema"; // schema

const migrations = {
  migration1,
};

// I'm not sure how to dynamically load migrations in electron
// So we're just importing them all directly
class ConstMigrationProvider implements MigrationProvider {
  public async getMigrations(): Promise<Record<string, Migration>> {
    return migrations;
  }
}

export async function migrateToLatest(db: Kysely<Database>) {
  const migrator = new Migrator({
    db,
    provider: new ConstMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      log.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      log.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error("failed to migrate");
    log.error(error);
    process.exit(1);
  }
}
