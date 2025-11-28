/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExpressionOrFactory, Kysely, OperandValueExpressionOrList, SqlBool, StringReference } from "kysely";

import { applyFilters } from "../filters/apply";
import type { ReplayFilter } from "../filters/types";
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
    continueFromStartTime: string | null = null,
    nextIdInclusive: number | null = null,
    direction: "asc" | "desc" = "desc",
  ) {
    let query = db.selectFrom("file").where("folder", "=", folder).innerJoin("game", "game.file_id", "file._id");

    if (nextIdInclusive != null) {
      query = query.where(handleContinuation("game.start_time", continueFromStartTime, nextIdInclusive, direction));
    }

    const res = await query
      .selectAll(["file", "game"])
      .select(["game._id as _id"])
      .orderBy("game.start_time", direction)
      .orderBy("game._id", direction)
      .limit(limit)
      .execute();
    return res;
  }

  public static async findGamesOrderByLastFrame(
    db: DB,
    folder: string,
    limit: number,
    continueFromLastFrame: number | null = null,
    nextIdInclusive: number | null = null,
    direction: "asc" | "desc" = "desc",
  ) {
    let query = db.selectFrom("file").where("folder", "=", folder).innerJoin("game", "game.file_id", "file._id");

    if (nextIdInclusive != null) {
      query = query.where(handleContinuation("game.last_frame", continueFromLastFrame, nextIdInclusive, direction));
    }

    const res = await query
      .selectAll(["file", "game"])
      .select(["game._id as _id"])
      .orderBy("game.last_frame", direction)
      .orderBy("game._id", direction)
      .limit(limit)
      .execute();
    return res;
  }

  /**
   * Search for games with filters and pagination
   *
   * @param db Database connection
   * @param folder Folder to search in
   * @param filters Array of filters to apply (AND logic between filters)
   * @param options Pagination and ordering options
   * @returns Array of game records with file information
   */
  public static async searchGames(
    db: DB,
    folder: string,
    filters: ReplayFilter[],
    options: {
      limit: number;
      orderBy: { field: "startTime" | "lastFrame"; direction: "asc" | "desc" };
      continuationValue?: string | number | null;
      nextIdInclusive?: number;
    },
  ) {
    let query = db.selectFrom("file").where("folder", "=", folder).innerJoin("game", "game.file_id", "file._id");

    // Apply all filters (AND logic)
    query = applyFilters(query, filters);

    // Apply pagination
    if (options.nextIdInclusive != null) {
      const field = options.orderBy.field === "startTime" ? "game.start_time" : "game.last_frame";
      query = query.where(
        handleContinuation(
          field as any,
          options.continuationValue ?? null,
          options.nextIdInclusive,
          options.orderBy.direction,
        ),
      );
    }

    // Apply ordering
    const orderField = options.orderBy.field === "startTime" ? "game.start_time" : "game.last_frame";
    const res = await query
      .selectAll(["file", "game"])
      .select(["game._id as _id"])
      .orderBy(orderField as any, options.orderBy.direction)
      .orderBy("game._id", options.orderBy.direction)
      .limit(options.limit)
      .execute();

    return res;
  }
}

function handleContinuation<K extends StringReference<Database, "file" | "game">>(
  field: K,
  continuationValue: OperandValueExpressionOrList<Database, "file" | "game", K> | null,
  nextIdInclusive: number,
  sortDirection: "asc" | "desc",
): ExpressionOrFactory<Database, "file" | "game", SqlBool> {
  switch (sortDirection) {
    case "asc":
      return ({ eb, or, and }) => {
        if (continuationValue == null) {
          return and([eb(field, "is", null), eb("game._id", ">=", nextIdInclusive)]);
        }

        return or([
          and([eb(field, ">", continuationValue), eb(field, "is not", null)]),
          and([
            or([eb(field, "=", continuationValue), eb(field, "is not", null)]),
            eb("game._id", ">=", nextIdInclusive),
          ]),
        ]);
      };
    case "desc":
      return ({ eb, or, and }) => {
        if (continuationValue == null) {
          return and([eb(field, "is", null), eb("game._id", "<=", nextIdInclusive)]);
        }

        return or([
          or([eb(field, "<", continuationValue), eb(field, "is", null)]),
          and([or([eb(field, "=", continuationValue), eb(field, "is", null)]), eb("game._id", "<=", nextIdInclusive)]),
        ]);
      };
    default:
      throw new Error(`Unexpected direction: ${sortDirection}`);
  }
}
