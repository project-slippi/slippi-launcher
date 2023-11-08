import type { Kysely } from "kysely";

import type { Database, NewPlayer, PlayerRecord } from "../schema";

type DB = Kysely<Database>;

export class PlayerRepository {
  public static async insertPlayer(db: DB, player: NewPlayer) {
    return db.insertInto("player").values(player).returning("_id").executeTakeFirstOrThrow();
  }

  public static async findAllPlayersByGame(db: DB, ...gameId: number[]): Promise<Map<number, PlayerRecord[]>> {
    const query = db.selectFrom("player").where("game_id", "in", gameId).orderBy(["player.game_id", "player.index"]);

    const res = await query.selectAll().execute();

    const gameIdToPlayersMap = new Map<number, PlayerRecord[]>();
    for (const player of res) {
      const gameId = player.game_id;
      const playerRecords = gameIdToPlayersMap.get(gameId) ?? [];
      playerRecords.push(player);
      gameIdToPlayersMap.set(gameId, playerRecords);
    }

    return gameIdToPlayersMap;
  }
}
