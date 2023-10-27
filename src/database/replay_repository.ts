import type { Kysely } from "kysely";

import type { Database, NewReplay } from "./schema";

type DB = Kysely<Database>;

export async function insertReplay(db: DB, replay: NewReplay) {
  return db.insertInto("replay").values(replay).returning("_id").executeTakeFirstOrThrow();
}

export async function findAllReplaysInFolder(db: DB, folder: string): Promise<{ _id: number; file_name: string }[]> {
  const query = db.selectFrom("replay").where("folder", "=", folder);
  const records = await query.select(["_id", "file_name"]).execute();
  return records;
}

export async function deleteReplaysById(db: DB, ids: number[]) {
  return await db.deleteFrom("replay").where("_id", "in", ids).execute();
}
