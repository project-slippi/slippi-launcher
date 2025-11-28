/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
  ExpressionOrFactory,
  Kysely,
  OperandValueExpressionOrList,
  SelectQueryBuilder,
  SqlBool,
  StringReference,
} from "kysely";

import type { ReplayFilter } from "../filters/types";
import type { Database, GameRecord, NewGame } from "../schema";

type DB = Kysely<Database>;

/**
 * Stadium game modes (Home Run Contest, Target Test) that should be excluded from duration filtering
 */
const STADIUM_GAME_MODES = [0x20, 0x0f]; // 32 (HOME_RUN_CONTEST), 15 (TARGET_TEST)

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

    // Apply each filter (AND logic)
    for (const filter of filters) {
      query = applyFilter(query, filter);
    }

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

/**
 * Apply a single filter to a query
 */
function applyFilter(
  query: SelectQueryBuilder<Database, "file" | "game", {}>,
  filter: ReplayFilter,
): SelectQueryBuilder<Database, "file" | "game", {}> {
  switch (filter.type) {
    case "duration":
      return applyDurationFilter(query, filter);
    case "player":
      return applyPlayerFilter(query, filter);
    case "gameMode":
      return applyGameModeFilter(query, filter);
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = filter;
      void _exhaustive;
      return query;
    }
  }
}

/**
 * Apply duration filter to query
 * Stadium modes (Home Run Contest, Target Test) are excluded from duration filtering
 */
function applyDurationFilter(
  query: SelectQueryBuilder<Database, "file" | "game", {}>,
  filter: Extract<ReplayFilter, { type: "duration" }>,
): SelectQueryBuilder<Database, "file" | "game", {}> {
  return query.where((eb) => {
    const conditions = [];

    // Always include stadium modes regardless of duration
    conditions.push(eb("game.mode", "in", STADIUM_GAME_MODES));

    // Build duration conditions
    const durationConditions = [];

    if (filter.minFrames != null) {
      durationConditions.push(eb("game.last_frame", ">=", filter.minFrames));
    }

    if (filter.maxFrames != null) {
      durationConditions.push(eb("game.last_frame", "<=", filter.maxFrames));
    }

    // Combine duration conditions with AND
    if (durationConditions.length > 0) {
      conditions.push(eb.and(durationConditions));
    }

    // Always include games with unknown duration (null)
    conditions.push(eb("game.last_frame", "is", null));

    // OR all conditions together
    return eb.or(conditions);
  });
}

/**
 * Apply player filter to query
 * Uses EXISTS subquery to find games where a player matching the criteria participated
 * All filter fields must match the same player (AND logic)
 */
function applyPlayerFilter(
  query: SelectQueryBuilder<Database, "file" | "game", {}>,
  filter: Extract<ReplayFilter, { type: "player" }>,
): SelectQueryBuilder<Database, "file" | "game", {}> {
  return query.where((eb) =>
    eb.exists(
      eb
        .selectFrom("player")
        .whereRef("player.game_id", "=", "game._id")
        .where((eb2) => {
          const conditions = [];

          // Add identifier conditions (all must match - AND logic)
          if (filter.connectCode != null) {
            conditions.push(eb2("player.connect_code", "=", filter.connectCode));
          }
          if (filter.userId != null) {
            conditions.push(eb2("player.user_id", "=", filter.userId));
          }
          if (filter.displayName != null) {
            conditions.push(eb2("player.display_name", "=", filter.displayName));
          }
          if (filter.tag != null) {
            conditions.push(eb2("player.tag", "=", filter.tag));
          }
          if (filter.port != null) {
            conditions.push(eb2("player.port", "=", filter.port));
          }
          if (filter.characterIds != null && filter.characterIds.length > 0) {
            conditions.push(eb2("player.character_id", "in", filter.characterIds));
          }

          // Add winner condition if specified
          if (filter.mustBeWinner === true) {
            conditions.push(eb2("player.is_winner", "=", 1));
          }

          // Combine all conditions with AND
          return eb2.and(conditions);
        })
        .select("player._id"),
    ),
  );
}

/**
 * Apply game mode filter to query
 */
function applyGameModeFilter(
  query: SelectQueryBuilder<Database, "file" | "game", {}>,
  filter: Extract<ReplayFilter, { type: "gameMode" }>,
): SelectQueryBuilder<Database, "file" | "game", {}> {
  if (filter.modes.length === 0) {
    return query;
  }
  return query.where("game.mode", "in", filter.modes);
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
