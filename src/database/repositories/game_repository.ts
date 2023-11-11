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

  public static async findGamesOrderByStartTime(
    db: DB,
    folder: string,
    limit: number,
    continueFromStartTime: string | null,
    nextIdInclusive: number | null,
  ) {
    let query = db.selectFrom("file").where("folder", "=", folder).innerJoin("game", "game.file_id", "file._id");

    if (nextIdInclusive != null) {
      query = query.where(({ eb, or, and }) =>
        or([
          eb("game.start_time", "<", continueFromStartTime),
          and([eb("game.start_time", "=", continueFromStartTime), eb("game._id", "<=", nextIdInclusive)]),
        ]),
      );
    }

    const res = await query
      .selectAll(["file", "game"])
      .select(["game._id as _id"])
      .orderBy("game.start_time", "desc")
      .orderBy("game._id", "desc")
      .limit(limit)
      .execute();
    return res;
  }
}
