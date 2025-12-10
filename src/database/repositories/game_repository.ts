/* eslint-disable @typescript-eslint/no-empty-object-type */
import { chunk } from "@common/chunk";
import type { ExpressionOrFactory, Kysely, OperandValueExpressionOrList, SqlBool, StringReference } from "kysely";

import { applyFilters } from "../filters/apply";
import type { ReplayFilter } from "../filters/types";
import type { Database, GameRecord, NewGame } from "../schema";

type DB = Kysely<Database>;

const SQLITE_PARAM_LIMIT_BATCH_SIZE = 500;

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

  /**
   * Count games with filters
   *
   * @param db Database connection
   * @param folder Folder to search in (if empty/null, searches all folders)
   * @param filters Array of filters to apply (AND logic between filters)
   * @returns Number of games matching the criteria
   */
  public static async countGames(db: DB, folder: string | null, filters: ReplayFilter[]): Promise<number> {
    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");

    // Apply folder filter if specified
    if (folder != null && folder !== "") {
      query = query.where("folder", "=", folder);
    }

    // Apply all filters (AND logic)
    query = applyFilters(query, filters);

    const result = await query.select(({ fn }) => fn.count<number>("game._id").as("count")).executeTakeFirstOrThrow();

    return Number(result.count);
  }

  /**
   * Search for games with filters and pagination
   *
   * @param db Database connection
   * @param folder Folder to search in (if empty/null, searches all folders)
   * @param filters Array of filters to apply (AND logic between filters)
   * @param options Pagination and ordering options
   * @returns Array of game records with file information
   */
  public static async searchGames(
    db: DB,
    folder: string | null,
    filters: ReplayFilter[],
    options: {
      limit: number;
      orderBy: { field: "startTime" | "lastFrame"; direction: "asc" | "desc" };
      continuationValue?: string | number | null;
      nextIdInclusive?: number;
    },
  ) {
    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");

    // Apply folder filter if specified
    if (folder != null && folder !== "") {
      query = query.where("folder", "=", folder);
    }

    // Apply all filters (AND logic)
    query = applyFilters(query, filters);

    // Apply pagination
    if (options.nextIdInclusive != null) {
      const field = options.orderBy.field === "startTime" ? "game.start_time" : "game.last_frame";
      query = query.where(
        handleContinuation(
          field,
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
      .orderBy(orderField, options.orderBy.direction)
      .orderBy("game._id", options.orderBy.direction)
      .limit(options.limit)
      .execute();

    return res;
  }

  /**
   * Get file IDs for games matching filters (for bulk deletion)
   *
   * @param db Database connection
   * @param folder Folder to search in (if empty/null, searches all folders)
   * @param filters Array of filters to apply (AND logic between filters)
   * @param excludeFileIds Optional file IDs to exclude from the results
   * @returns Array of file IDs
   */
  public static async getFileIdsForBulkDelete(
    db: DB,
    folder: string | null,
    filters: ReplayFilter[],
    excludeFileIds?: number[],
  ): Promise<number[]> {
    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");

    // Apply folder filter if specified
    if (folder != null && folder !== "") {
      query = query.where("folder", "=", folder);
    }

    // Apply all filters (AND logic)
    query = applyFilters(query, filters);

    // Exclude specific file IDs if provided
    // For large exclude lists (>999), we need to batch the NOT IN clauses
    // to stay under SQLite's parameter limit
    if (excludeFileIds && excludeFileIds.length > 0) {
      if (excludeFileIds.length <= SQLITE_PARAM_LIMIT_BATCH_SIZE) {
        // Small list: use single NOT IN clause
        query = query.where("file._id", "not in", excludeFileIds);
      } else {
        // Large list: apply NOT IN in batches using AND conditions
        // Each batch adds a NOT IN constraint, all must be satisfied
        const batches = chunk(excludeFileIds, SQLITE_PARAM_LIMIT_BATCH_SIZE);
        for (const batch of batches) {
          query = query.where("file._id", "not in", batch);
        }
      }
    }

    const res = await query.select("file._id").execute();

    return res.map((row) => row._id);
  }

  /**
   * Get all file paths for games matching filters with ordering
   *
   * @param db Database connection
   * @param folder Folder to search in (if empty/null, searches all folders)
   * @param filters Array of filters to apply (AND logic between filters)
   * @param orderBy Ordering options
   * @returns Array of file paths with folder and name
   */
  public static async getAllFilePaths(
    db: DB,
    folder: string | null,
    filters: ReplayFilter[],
    orderBy: { field: "startTime" | "lastFrame"; direction: "asc" | "desc" },
  ): Promise<{ folder: string; name: string }[]> {
    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");

    // Apply folder filter if specified
    if (folder != null && folder !== "") {
      query = query.where("folder", "=", folder);
    }

    // Apply all filters (AND logic)
    query = applyFilters(query, filters);

    // Apply ordering
    const orderField = orderBy.field === "startTime" ? "game.start_time" : "game.last_frame";
    const res = await query
      .select(["file.folder", "file.name"])
      .orderBy(orderField, orderBy.direction)
      .orderBy("game._id", orderBy.direction)
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
          // Paginating through null values (nulls come first in ASC)
          return and([eb(field, "is", null), eb("game._id", ">=", nextIdInclusive)]);
        }

        // Paginating through non-null values (already past nulls in ASC)
        return or([
          and([eb(field, ">", continuationValue), eb(field, "is not", null)]),
          and([eb(field, "=", continuationValue), eb("game._id", ">=", nextIdInclusive)]),
        ]);
      };
    case "desc":
      return ({ eb, or, and }) => {
        if (continuationValue == null) {
          // Paginating through null values (nulls come last in DESC)
          return and([eb(field, "is", null), eb("game._id", "<=", nextIdInclusive)]);
        }

        // Paginating through non-null values or transitioning to nulls (nulls come last in DESC)
        return or([
          and([eb(field, "<", continuationValue), eb(field, "is not", null)]),
          and([eb(field, "=", continuationValue), eb("game._id", "<=", nextIdInclusive)]),
          eb(field, "is", null), // Include all nulls since they come after all non-null values in DESC
        ]);
      };
    default:
      throw new Error(`Unexpected direction: ${sortDirection}`);
  }
}
