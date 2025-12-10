import { chunk } from "@common/chunk";
import type { Kysely } from "kysely";

import type { Database, NewPlayer, PlayerRecord } from "../schema";

type DB = Kysely<Database>;

// SQLite has a limit of 999 parameters per query
const SQLITE_PARAM_LIMIT_BATCH_SIZE = 500;

export class PlayerRepository {
  public static async insertPlayer(db: DB, ...player: NewPlayer[]): Promise<PlayerRecord[]> {
    return db.insertInto("player").values(player).returningAll().execute();
  }

  public static async findAllPlayersByGame(db: DB, ...gameId: number[]): Promise<Map<number, PlayerRecord[]>> {
    const gameIdToPlayersMap = new Map<number, PlayerRecord[]>();

    // Batch the query to stay under SQLite's 999 parameter limit
    // This ensures the code works regardless of how many game IDs are passed
    const batches = chunk(gameId, SQLITE_PARAM_LIMIT_BATCH_SIZE);

    for (const batch of batches) {
      const query = db.selectFrom("player").where("game_id", "in", batch).orderBy(["player.game_id", "player.port"]);
      const playerRecords = await query.selectAll().execute();
      const totalRecords = playerRecords.length;

      // We care about performance so use a for-loop for speed
      for (let i = 0; i < totalRecords; i++) {
        const player = playerRecords[i];
        const gameId = player.game_id;
        const players = gameIdToPlayersMap.get(gameId) ?? [];
        players.push(player);
        gameIdToPlayersMap.set(gameId, players);
      }
    }

    return gameIdToPlayersMap;
  }
}
