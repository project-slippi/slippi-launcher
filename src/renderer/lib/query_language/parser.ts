/**
 * Query Parser
 *
 * Main parser that converts a query string into structured filters.
 * Processes tokens from the tokenizer and builds QueryFilters object.
 */

import type { ReplayFilter } from "@database/filters/types";

import { getFilterDefinition, getPortFromAlias } from "./filter_schema";
import { tokenize } from "./tokenizer";
import type { ParsedQuery, QueryError, QueryFilters } from "./types";
import { parseValue } from "./value_parser";

/**
 * Parse a query string into structured filters
 *
 * Examples:
 * - "mango" -> { searchText: ["mango"], filters: {}, errors: [] }
 * - "stage:FD minDuration:30s" -> { searchText: [], filters: { stages: [32], minDuration: 1800 }, errors: [] }
 * - "mango char:fox winner:MANG#0" -> Complex player filters
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
        if (token.value === "NOT") {
          negateNext = true;
        }
        break;

      case "FILTER":
        try {
          // Special handling for port aliases (p1, p2, p3, p4)
          // They need character parsing, not port number parsing
          const portNum = getPortFromAlias(token.key!);
          if (portNum !== undefined) {
            // Port alias - parse value as character
            const charFilter = getFilterDefinition("character");
            if (charFilter) {
              const parsedValue = parseValue(token.value, charFilter);
              const characterIds = Array.isArray(parsedValue) ? parsedValue : [parsedValue];

              if (negateNext) {
                filters.excludeFilters = filters.excludeFilters || {};
                filters.excludeFilters.playerFilters = filters.excludeFilters.playerFilters || [];
                filters.excludeFilters.playerFilters.push({ port: portNum, characterIds });
              } else {
                filters.playerFilters = filters.playerFilters || [];
                filters.playerFilters.push({ port: portNum, characterIds });
              }
              negateNext = false;
              break;
            }
          }

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

          const parsedValue = parseValue(token.value, def);
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

  // Duration filters
  if (lowerKey === "minduration" || lowerKey === "minlength") {
    filters.minDuration = value;
    return;
  }

  if (lowerKey === "maxduration" || lowerKey === "maxlength") {
    filters.maxDuration = value;
    return;
  }

  // Character filter (any player)
  if (lowerKey === "character" || lowerKey === "char") {
    const characterIds = Array.isArray(value) ? value : [value];
    filters.playerFilters = filters.playerFilters || [];
    filters.playerFilters.push({ characterIds });
    return;
  }

  // Stage filter - NOT IMPLEMENTED YET (backend doesn't support stage filter)
  if (lowerKey === "stage") {
    // Store for future use, but won't be applied to backend filters yet
    // filters.stages = Array.isArray(value) ? value : [value];
    return;
  }

  // Port filter (port:N)
  // Note: Port aliases (p1, p2, p3, p4) are handled in parseQuery() before calling applyFilter()
  if (lowerKey === "port") {
    // port:N specified directly
    filters.playerFilters = filters.playerFilters || [];
    filters.playerFilters.push({ port: value });
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
    const useFuzzy = valueWasQuoted !== true; // Default to fuzzy unless explicitly quoted
    filters.playerFilters.push({
      tag: value,
      tagFuzzy: useFuzzy,
    });
    return;
  }

  // Winner filter
  if (lowerKey === "winner") {
    filters.playerFilters = filters.playerFilters || [];
    // Try to determine if it's a connect code or tag
    // Connect codes typically have # in them
    if (value.includes("#")) {
      filters.playerFilters.push({ connectCode: value, mustBeWinner: true });
    } else {
      const useFuzzy = valueWasQuoted !== true;
      filters.playerFilters.push({
        tag: value,
        tagFuzzy: useFuzzy,
        mustBeWinner: true,
      });
    }
    return;
  }

  // Loser filter (winner: false)
  if (lowerKey === "loser") {
    filters.playerFilters = filters.playerFilters || [];
    if (value.includes("#")) {
      filters.playerFilters.push({ connectCode: value, mustBeWinner: false });
    } else {
      const useFuzzy = valueWasQuoted !== true;
      filters.playerFilters.push({
        tag: value,
        tagFuzzy: useFuzzy,
        mustBeWinner: false,
      });
    }
    return;
  }
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
        displayName: pf.displayName,
        tag: pf.tag,
        port: pf.port,
        characterIds: pf.characterIds,
        mustBeWinner: pf.mustBeWinner,
        // Pass through fuzzy matching flags
        tagFuzzy: pf.tagFuzzy,
        displayNameFuzzy: pf.displayNameFuzzy,
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

  // Text search filter
  if (queryFilters.textSearch && queryFilters.textSearch.trim() !== "") {
    filters.push({
      type: "textSearch",
      query: queryFilters.textSearch.trim(),
    });
  }

  // TODO: Handle excludeFilters (negation) - requires backend support for negation
  // For now, negation is parsed but not applied to backend filters

  return filters;
}
