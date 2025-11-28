/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { SelectQueryBuilder } from "kysely";

import type { Database } from "../schema";
import type { ReplayFilter } from "./types";
import { STADIUM_GAME_MODES } from "./types";

/**
 * Apply all filters to a query
 */
export function applyFilters(
  query: SelectQueryBuilder<Database, "file" | "game", {}>,
  filters: ReplayFilter[],
): SelectQueryBuilder<Database, "file" | "game", {}> {
  return filters.reduce((q, filter) => applyFilter(q, filter), query);
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
