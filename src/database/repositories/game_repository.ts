import type { Kysely } from "kysely";

import type { Database, NewGame } from "../schema";

type DB = Kysely<Database>;

export async function insertGame(db: DB, game: NewGame) {
  return db.insertInto("game").values(game).returning("_id").executeTakeFirstOrThrow();
}

export async function findGamesByFolder(db: DB, folder: string, limit: number) {
  const query = db.selectFrom("replay").where("folder", "=", folder).innerJoin("game", "game.replay_id", "replay._id");

  const res = await query.selectAll(["replay", "game"]).select(["game._id as _id"]).limit(limit).execute();
  return res;
}
