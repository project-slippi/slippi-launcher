import type { Kysely } from "kysely";

import type { Database, NewGame } from "../schema";

type DB = Kysely<Database>;

export async function insertGame(db: DB, game: NewGame) {
  return db.insertInto("game").values(game).returning("_id").executeTakeFirstOrThrow();
}

export async function findGameByReplayId(db: DB, replayId: number) {
  const query = db.selectFrom("replay").where("_id", "=", replayId).innerJoin("game", "game.replay_id", "replay._id");

  const res = await query.selectAll(["replay", "game"]).select(["game._id as _id"]).executeTakeFirst();
  return res;
}

export async function findGameByFolderAndFilename(db: DB, folder: string, filename: string) {
  const query = db
    .selectFrom("replay")
    .where("folder", "=", folder)
    .where("file_name", "=", filename)
    .innerJoin("game", "game.replay_id", "replay._id");

  const res = await query.selectAll(["replay", "game"]).select(["game._id as _id"]).executeTakeFirst();
  return res;
}

export async function findGamesByFolder(db: DB, folder: string, limit?: number) {
  let query = db.selectFrom("replay").where("folder", "=", folder).innerJoin("game", "game.replay_id", "replay._id");

  if (limit != null && limit > 0) {
    query = query.limit(limit);
  }

  const res = await query.selectAll(["replay", "game"]).select(["game._id as _id"]).execute();
  return res;
}
