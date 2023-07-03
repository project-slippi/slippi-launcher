import DatabaseConstructor from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Mutex } from "synchronized-ts";

import { migrateToLatest } from "./migration";
import type { Database } from "./types"; // schema

const synchronizeDBCreation = new Mutex<Kysely<Database>>();
const Databases: { [id: string]: Kysely<Database> } = {};

// This function is syncronized to avoid creation of multiple db clients
// It would be bad to have the db migrated at the same time in two threads
async function getKyselyDatabase(databaseName: string): Promise<Kysely<Database>> {
  return await synchronizeDBCreation.sync(async () => {
    if (databaseName in Databases) {
      return Databases[databaseName];
    }

    const dialect = new SqliteDialect({
      database: new DatabaseConstructor(databaseName),
    });

    const db = new Kysely<Database>({
      dialect,
    });

    await migrateToLatest(db);

    Databases[databaseName] = db;

    return db;
  });
}

export default getKyselyDatabase;
