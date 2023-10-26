import type { Kysely } from "kysely";

import type { Database, NewReplay } from "./schema";

type DB = Kysely<Database>;

export class ReplayRepository {
  public static async insertReplay(db: DB, replay: NewReplay) {
    return db.insertInto("replay").values(replay).returningAll().executeTakeFirstOrThrow();
  }

  public static async findReplaysInFolder(db: DB, folder: string, limit: number, continuation?: number) {
    let query = db.selectFrom("replay").where("folder", "=", folder);
    if (continuation != null) {
      query = query.where("_id", ">", continuation);
    }
    return await query.limit(limit).selectAll().execute();
  }

  public static async findReplaysByIds(db: DB, replayPaths: string[]): Promise<string[]> {
    return;
  }

  public static async deleteReplays(db: DB, replayPaths: string[]) {
    return await db.deleteFrom("replay").where("full_path", "in", replayPaths).execute();
  }
}
