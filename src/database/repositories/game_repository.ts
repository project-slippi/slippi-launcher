import type { Kysely } from "kysely";

import type { Database, GameRecord, NewGame } from "../schema";

type DB = Kysely<Database>;

export class GameRepository {
  public static async insertGame(db: DB, game: NewGame): Promise<GameRecord> {
    return db.insertInto("game").values(game).returningAll().executeTakeFirstOrThrow();
  }

  public static async findGameByFileId(db: DB, fileId: number) {
    const query = db.selectFrom("file").where("_id", "=", fileId).innerJoin("game", "game.file_id", "file._id");

    const res = await query.selectAll(["file", "game"]).select(["game._id as _id"]).executeTakeFirst();
    return res;
  }

  public static async findGameByFolderAndFilename(db: DB, folder: string, filename: string) {
    const query = db
      .selectFrom("file")
      .where("folder", "=", folder)
      .where("name", "=", filename)
      .innerJoin("game", "game.file_id", "file._id");

    const res = await query.selectAll(["file", "game"]).select(["game._id as _id"]).executeTakeFirst();
    return res;
  }

  public static async findGamesByFolder(db: DB, folder: string, limit?: number) {
    let query = db.selectFrom("file").where("folder", "=", folder).innerJoin("game", "game.file_id", "file._id");

    if (limit != null && limit > 0) {
      query = query.limit(limit);
    }

    const res = await query.selectAll(["file", "game"]).select(["game._id as _id"]).execute();
    return res;
  }
}
