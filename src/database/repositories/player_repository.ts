import type { Kysely } from "kysely";

import type { Database, NewPlayer } from "../schema";

type DB = Kysely<Database>;

export async function insertPlayer(db: DB, player: NewPlayer) {
  return db.insertInto("player").values(player).returning("_id").executeTakeFirstOrThrow();
}

export async function findAllPlayersByGame(db: DB, gameId: number) {
  const query = db.selectFrom("player").where("game_id", "=", gameId).orderBy("player.index");

  const res = await query
    .select([
      "index",
      "type",
      "character_id",
      "character_color",
      "team_id",
      "is_winner",
      "start_stocks",
      "connect_code",
      "display_name",
      "tag",
    ])
    .execute();
  return res;
}
