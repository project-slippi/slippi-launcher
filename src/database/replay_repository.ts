import type { Kysely } from "kysely";

import type { Database, NewReplay } from "./schema";

type DB = Kysely<Database>;

export class ReplayRepository {
  public static async insertReplay(db: DB, ...replay: NewReplay[]): Promise<void> {
    await db.insertInto("replay").values(replay).execute();
  }

  public static async findAllReplaysInFolder(db: DB, folder: string): Promise<{ _id: number; file_name: string }[]> {
    const query = db.selectFrom("replay").where("folder", "=", folder);
    const records = await query.select(["_id", "file_name"]).execute();
    return records;
  }

  public static async deleteReplaysById(db: DB, ids: number[]) {
    return await db.deleteFrom("replay").where("_id", "in", ids).execute();
  }
}
