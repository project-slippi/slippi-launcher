import type { FileLoadResult, FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import DatabaseConstructor from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import type { Database } from "./schema";

export class DatabaseReplayProvider implements ReplayProvider {
  private database: Kysely<Database>;

  constructor(databaseName: string) {
    const dialect = new SqliteDialect({
      database: new DatabaseConstructor(databaseName),
    });

    this.database = new Kysely<Database>({
      dialect,
    });

    // await migrateToLatest(db);

    // Databases[databaseName] = db;
    // return db;
  }

  public init(): void {
    // Do nothing
  }
  public loadFile(filePath: string): Promise<FileResult> {
    throw new Error("Method not implemented.");
  }
  public loadFolder(folder: string, onProgress?: (progress: Progress) => void): Promise<FileLoadResult> {
    throw new Error("Method not implemented.");
  }
  public calculateGameStats(fullPath: string): Promise<StatsType | null> {
    throw new Error("Method not implemented.");
  }
  public calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null> {
    throw new Error("Method not implemented.");
  }
}
