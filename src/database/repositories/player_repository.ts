import type { Kysely } from "kysely";

import type { Database, NewPlayer } from "../schema";

type DB = Kysely<Database>;

export class PlayerRepository {
  public static async insertPlayer(db: DB, player: NewPlayer) {
    return db.insertInto("player").values(player).returning("_id").executeTakeFirstOrThrow();
  }

  public static async findAllPlayersByGame(db: DB, gameId: number) {
    const query = db.selectFrom("player").where("game_id", "=", gameId).orderBy("player.index");

    const res = await query.selectAll().execute();
    return res;
  }
}
