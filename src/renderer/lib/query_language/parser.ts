/**
 * Query Parser
 *
 * Main parser that converts a query string into structured filters.
 * Processes tokens from the tokenizer and builds QueryFilters object.
 */

import type { ReplayFilter } from "@database/filters/types";

import { getFilterDefinition } from "./filter_schema";
import { tokenize } from "./tokenizer";
import type { MatchupFilter, ParsedQuery, QueryError, QueryFilters } from "./types";
import { parseValue } from "./value_parser";

export const ME_MARKER = "@me";
const NEGATED_ME_MARKER = `-${ME_MARKER}`;

/**
 * Parse a query string into structured filters
 *
 * Examples:
 * - "mango" -> { searchText: ["mango"], filters: {}, errors: [] }
 * - "stage:FD duration:>30s" -> { searchText: [], filters: { stages: [32], minDuration: 1800 }, errors: [] }
 * - "mango char:fox winner:MANG#0" -> Complex player filters
 * - "fox>marth" -> Matchup filter: Fox beat Marth
 * - "fox>" -> Matchup filter: Fox won (any opponent)
 * - ">marth" -> Matchup filter: Marth lost (any opponent)
 *
 * @param query The query string to parse
 * @returns Parsed query with filters and any errors
 */
export function parseQuery(query: string): ParsedQuery {
  const tokens = tokenize(query);
  const searchText: string[] = [];
  const filters: QueryFilters = {};
  const errors: QueryError[] = [];

  let i = 0;
  let negateNext = false;

  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case "OPERATOR":
        // Only support negation via "-" prefix (e.g., -char:falco)
        if (token.value === "NOT") {
          negateNext = true;
        }
        break;

      case "MATCHUP":
        try {
          const matchup = parseMatchupToken(token);
          filters.matchups = filters.matchups || [];
          filters.matchups.push(matchup);
        } catch (err: any) {
          errors.push({
            type: "INVALID_VALUE",
            message: `Invalid matchup: ${err.message}`,
            position: token.position,
          });
        }
        break;

      case "FILTER":
        try {
          const def = getFilterDefinition(token.key!);
          if (!def) {
            errors.push({
              type: "INVALID_KEY",
              message: `Unknown filter key: "${token.key}"`,
              position: token.position,
              key: token.key,
            });
            break;
          }

          const parsedValue = parseValue(token.value, def, token.valueWasQuoted);
          applyFilter(filters, token.key!, parsedValue, negateNext, token.valueWasQuoted);
          negateNext = false;
        } catch (err: any) {
          errors.push({
            type: "INVALID_VALUE",
            message: `Invalid value for ${token.key}: ${err.message}`,
            position: token.position,
            key: token.key,
          });
          negateNext = false;
        }
        break;

      case "QUOTED":
      case "WORD":
        if (token.type === "WORD") {
          // We have a fallthrough here, so we need to handle the WORD case
          // and then break out of the switch
          const lowerValue = token.value.toLowerCase();
          const isMe = lowerValue === ME_MARKER;
          const isNegatedMe = lowerValue === NEGATED_ME_MARKER;

          if (isMe || isNegatedMe) {
            if (isNegatedMe) {
              filters.excludeFilters = filters.excludeFilters || {};
              filters.excludeFilters.playerFilters = filters.excludeFilters.playerFilters || [];
              filters.excludeFilters.playerFilters.push({ userId: ME_MARKER });
            } else {
              filters.playerFilters = filters.playerFilters || [];
              filters.playerFilters.push({ userId: ME_MARKER });
            }
            break;
          }
        }

        // Ignore WORD tokens that match known filter keys AND have a colon after them
        // (e.g., "char:" or "stage:" with no value)
        // This only applies if there's actually a colon, so "char" as free text is still valid
        if (token.type === "WORD" && getFilterDefinition(token.value)) {
          // Check if the original query has a colon after this word
          const positionAfterWord = token.position + token.value.length;
          if (positionAfterWord < query.length && query[positionAfterWord] === ":") {
            // This is an incomplete filter expression (e.g., "char:"), skip it
            negateNext = false;
            break;
          }
        }

        if (!negateNext) {
          searchText.push(token.value);
        } else {
          // Can't negate search text, ignore the NOT
          searchText.push(token.value);
          negateNext = false;
        }
        break;
    }

    i++;
  }

  // If there's search text, add it to filters
  if (searchText.length > 0) {
    filters.textSearch = searchText.join(" ");
  }

  return { searchText, filters, errors };
}

/**
 * Apply a filter to the filters object
 * @param valueWasQuoted - Whether the value was quoted (for fuzzy vs exact matching)
 */
function applyFilter(filters: QueryFilters, key: string, value: any, negate: boolean, valueWasQuoted?: boolean): void {
  // Handle negation by applying to excludeFilters
  if (negate) {
    filters.excludeFilters = filters.excludeFilters || {};
    applyFilter(filters.excludeFilters, key, value, false, valueWasQuoted);
    return;
  }

  const lowerKey = key.toLowerCase();

  // Duration filter
  if (lowerKey === "duration" || lowerKey === "length") {
    const dur = value as { operator?: ">" | "<"; frames: number };
    if (dur.operator === ">") {
      filters.minDuration = dur.frames;
    } else if (dur.operator === "<") {
      filters.maxDuration = dur.frames;
    } else {
      filters.minDuration = dur.frames;
    }
    return;
  }

  // Character filter (any player)
  if (lowerKey === "character" || lowerKey === "char") {
    const characterIds = Array.isArray(value) ? value : [value];
    filters.playerFilters = filters.playerFilters || [];
    filters.playerFilters.push({ characterIds });
    return;
  }

  // Stage filter
  if (lowerKey === "stage") {
    const stageIds = Array.isArray(value) ? value : [value];
    filters.stageIds = filters.stageIds || [];
    filters.stageIds.push(...stageIds);
    return;
  }

  // Connect code filter
  if (lowerKey === "code") {
    filters.playerFilters = filters.playerFilters || [];
    filters.playerFilters.push({ connectCode: value });
    return;
  }

  // Tag/name filter
  // Unquoted = fuzzy match (LIKE), Quoted = exact match (=)
  if (lowerKey === "tag" || lowerKey === "name") {
    filters.playerFilters = filters.playerFilters || [];
    const useExact = valueWasQuoted === true; // Exact only if explicitly quoted
    const filter: any = { tag: value };
    if (useExact) {
      filter.tagExact = true; // Only set flag if exact (fuzzy is default)
    }
    filters.playerFilters.push(filter);
    return;
  }

  // Winner filter
  if (lowerKey === "winner") {
    filters.playerFilters = filters.playerFilters || [];
    // Handle @me as special userId filter
    if (value === ME_MARKER) {
      filters.playerFilters.push({ userId: ME_MARKER, mustBeWinner: true });
      return;
    }
    // Try to determine if it's a connect code or tag
    // Connect codes typically have # in them
    if (value.includes("#")) {
      filters.playerFilters.push({ connectCode: value, mustBeWinner: true });
    } else {
      const useExact = valueWasQuoted === true;
      const filter: any = { tag: value, mustBeWinner: true };
      if (useExact) {
        filter.tagExact = true; // Only set flag if exact (fuzzy is default)
      }
      filters.playerFilters.push(filter);
    }
    return;
  }

  // Loser filter (winner: false)
  if (lowerKey === "loser") {
    filters.playerFilters = filters.playerFilters || [];
    // Handle @me as special userId filter
    if (value === ME_MARKER) {
      filters.playerFilters.push({ userId: ME_MARKER, mustBeWinner: false });
      return;
    }
    if (value.includes("#")) {
      filters.playerFilters.push({ connectCode: value, mustBeWinner: false });
    } else {
      const useExact = valueWasQuoted === true;
      const filter: any = { tag: value, mustBeWinner: false };
      if (useExact) {
        filter.tagExact = true; // Only set flag if exact (fuzzy is default)
      }
      filters.playerFilters.push(filter);
    }
    return;
  }

  // Date filter
  if (lowerKey === "date") {
    const date = value as {
      operator?: ">" | "<" | ">=" | "<=";
      isoString: string;
      endIsoString?: string;
    };
    if (date.operator === ">") {
      filters.minDate = date.isoString;
    } else if (date.operator === "<") {
      filters.maxDateExclusive = date.isoString;
    } else if (date.operator === ">=") {
      filters.minDate = date.isoString;
    } else if (date.operator === "<=") {
      filters.maxDate = date.isoString;
    } else {
      // Exact date: >= start of day AND < start of next day
      filters.minDate = date.isoString;
      filters.maxDateExclusive = date.endIsoString;
    }
    return;
  }

  // Game type filter: is:ranked, is:teams, is:doubles, is:singles, is:unranked
  if (lowerKey === "is") {
    const gameType = (value as string).toLowerCase();

    // Handle aliases
    if (gameType === "doubles") {
      filters.isTeams = true;
      return;
    }
    if (gameType === "singles") {
      filters.isTeams = false;
      return;
    }
    if (gameType === "unranked") {
      filters.isRanked = false;
      return;
    }

    // Direct values
    if (gameType === "ranked") {
      filters.isRanked = true;
      return;
    }
    if (gameType === "teams") {
      filters.isTeams = true;
      return;
    }

    // Unknown value - ignore
    return;
  }
}

/**
 * Parse a matchup token (e.g., "fox>marth", "fox>", ">marth")
 * Parses character names and creates matchup filter
 */
interface MatchupToken {
  type: "MATCHUP";
  winner: string;
  loser: string;
  position: number;
  valueWasQuoted?: boolean;
}

function parseMatchupToken(token: MatchupToken): MatchupFilter {
  const charFilter = getFilterDefinition("character");
  if (!charFilter) {
    throw new Error("Character filter definition not found");
  }

  const matchup: MatchupFilter = {};

  // Parse winner side
  if (token.winner) {
    try {
      const winnerIds = parseValue(token.winner, charFilter, false);
      matchup.winnerCharIds = Array.isArray(winnerIds) ? winnerIds : [winnerIds];
    } catch (err: any) {
      throw new Error(`Invalid winner character "${token.winner}": ${err.message}`);
    }
  }

  // Parse loser side
  if (token.loser) {
    try {
      const loserIds = parseValue(token.loser, charFilter, false);
      matchup.loserCharIds = Array.isArray(loserIds) ? loserIds : [loserIds];
    } catch (err: any) {
      throw new Error(`Invalid loser character "${token.loser}": ${err.message}`);
    }
  }

  // Must have at least one side
  if (!matchup.winnerCharIds && !matchup.loserCharIds) {
    throw new Error("Matchup must have at least a winner or loser character");
  }

  return matchup;
}

/**
 * Convert QueryFilters to ReplayFilter[] for backend
 *
 * This function converts the parsed query filters into the ReplayFilter array
 * format expected by the backend database filtering system.
 */
export function convertToReplayFilters(queryFilters: QueryFilters): ReplayFilter[] {
  const filters: ReplayFilter[] = [];

  // Duration filter
  if (queryFilters.minDuration !== undefined || queryFilters.maxDuration !== undefined) {
    filters.push({
      type: "duration",
      minFrames: queryFilters.minDuration,
      maxFrames: queryFilters.maxDuration,
    });
  }

  // Player filters
  if (queryFilters.playerFilters && queryFilters.playerFilters.length > 0) {
    queryFilters.playerFilters.forEach((pf) => {
      filters.push({
        type: "player",
        connectCode: pf.connectCode,
        userId: pf.userId,
        displayName: pf.displayName,
        tag: pf.tag,
        characterIds: pf.characterIds,
        mustBeWinner: pf.mustBeWinner,
        // Pass through exact matching flags
        tagExact: pf.tagExact,
        displayNameExact: pf.displayNameExact,
        negate: pf.negate,
      });
    });
  }

  // Game mode filter
  if (queryFilters.gameModes && queryFilters.gameModes.length > 0) {
    filters.push({
      type: "gameMode",
      modes: queryFilters.gameModes,
    });
  }

  // Stage filter
  if (queryFilters.stageIds && queryFilters.stageIds.length > 0) {
    filters.push({
      type: "stage",
      stageIds: queryFilters.stageIds,
    });
  }

  // Text search filter
  if (queryFilters.textSearch && queryFilters.textSearch.trim() !== "") {
    filters.push({
      type: "textSearch",
      query: queryFilters.textSearch.trim(),
    });
  }

  // Handle excludeFilters (negation)
  if (queryFilters.excludeFilters) {
    const excludeFilters = convertToReplayFilters(queryFilters.excludeFilters);
    excludeFilters.forEach((filter) => {
      filters.push({
        ...filter,
        negate: true,
      });
    });
  }

  // Matchup filters (e.g., "fox>marth" -> winner played Fox, loser played Marth)
  // These require CORRELATED conditions - winner and loser must be different players in the SAME game
  // For single-sided (winner only or loser only), we use PlayerFilter with mustBeWinner
  if (queryFilters.matchups && queryFilters.matchups.length > 0) {
    queryFilters.matchups.forEach((matchup) => {
      // Only create MatchupFilter if BOTH winner and loser are specified
      // If only one side is specified, use the existing PlayerFilter approach
      if (
        matchup.winnerCharIds &&
        matchup.winnerCharIds.length > 0 &&
        matchup.loserCharIds &&
        matchup.loserCharIds.length > 0
      ) {
        // Full matchup: Fox beat Marth (both sides specified)
        filters.push({
          type: "matchup",
          winnerCharIds: matchup.winnerCharIds,
          loserCharIds: matchup.loserCharIds,
        });
      } else if (matchup.winnerCharIds && matchup.winnerCharIds.length > 0) {
        // Winner only: Fox won (any opponent) - use PlayerFilter
        filters.push({
          type: "player",
          characterIds: matchup.winnerCharIds,
          mustBeWinner: true,
        });
      } else if (matchup.loserCharIds && matchup.loserCharIds.length > 0) {
        // Loser only: Marth lost (any opponent) - use PlayerFilter
        filters.push({
          type: "player",
          characterIds: matchup.loserCharIds,
          mustBeWinner: false,
        });
      }
    });
  }

  // Date filter
  if (
    queryFilters.minDate !== undefined ||
    queryFilters.maxDate !== undefined ||
    queryFilters.maxDateExclusive !== undefined
  ) {
    filters.push({
      type: "date",
      minDate: queryFilters.minDate,
      maxDate: queryFilters.maxDate,
      maxDateExclusive: queryFilters.maxDateExclusive,
    });
  }

  // Ranked filter
  if (queryFilters.isRanked !== undefined) {
    filters.push({
      type: "ranked",
      isRanked: queryFilters.isRanked,
    });
  }

  // Teams filter
  if (queryFilters.isTeams !== undefined) {
    filters.push({
      type: "teams",
      isTeams: queryFilters.isTeams,
    });
  }

  return filters;
}
