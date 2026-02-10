/**
 * Value Parser
 *
 * Parses and validates values for different filter types.
 * Converts string values into the appropriate types (numbers, enums, durations, etc.)
 */

import type { FilterDefinition } from "./types";

/**
 * Normalize a string for matching (must match the normalization in filter_schema.ts)
 * - Converts to lowercase
 * - Removes diacritics (é → e, ō → o, etc.)
 * - Replaces spaces with underscores
 * - Removes apostrophes and special characters
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[']/g, ""); // Remove apostrophes
}

/**
 * Parse a value according to its filter definition
 *
 * @param value - The string value to parse
 * @param def - The filter definition
 * @param valueWasQuoted - Whether the value was quoted (for fuzzy vs exact matching)
 * @throws Error if value is invalid
 */
export function parseValue(value: string, def: FilterDefinition, valueWasQuoted?: boolean): any {
  switch (def.valueType) {
    case "enum":
      return parseEnumValue(value, def, valueWasQuoted);

    case "boolean":
      return parseBooleanValue(value);

    case "duration":
      return parseDuration(value);

    case "number":
      return parseNumber(value);

    case "string":
    default:
      return value;
  }
}

/**
 * Parse enum value(s)
 * Supports comma-separated values for OR logic
 *
 * Matching behavior:
 * - Unquoted (fuzzy): "battle" matches "battlefield", "yoshis" matches "Yoshi's Story"
 * - Quoted (exact): "battle" requires exact match on normalized value (will fail)
 *
 * Examples:
 * - "fox" -> 2 (Fox's character ID)
 * - "fox,falco" -> [2, 20] (Fox and Falco IDs)
 * - "battlefield" -> 31 (Battlefield stage ID)
 * - "battle" -> 31 (fuzzy match, unquoted)
 * - "battle" (quoted) -> Error (exact match only)
 */
function parseEnumValue(value: string, def: FilterDefinition, valueWasQuoted?: boolean): any {
  if (!def.enumValues) {
    throw new Error(`No enum values defined for ${def.key}`);
  }

  // Support comma-separated values
  const values = value.split(",").map((v) => v.trim());
  const enumValues = def.enumValues;

  const parsed = values.flatMap((v) => {
    // Normalize the input value for matching
    const normalizedInput = normalizeString(v);

    // For quoted values, require exact match on normalized value (precision)
    if (valueWasQuoted) {
      const exactMatch = enumValues.find((ev) => ev.value === normalizedInput);
      if (exactMatch) {
        return exactMatch.id !== undefined ? exactMatch.id : exactMatch.value;
      }
      // No exact match for quoted value
      throw new Error(
        `Invalid value: "${v}" (exact match). Expected one of: ${enumValues
          .slice(0, 5)
          .map((e) => e.value)
          .join(", ")}${enumValues.length > 5 ? "..." : ""}`,
      );
    }

    // For unquoted values, find matches with priority:
    // 1. First look for exact normalized matches (e.g., "falco" → "Falco", "yoshis_story" → "Yoshi's Story")
    // 2. Also check aliases for exact matches (e.g., "falcon" → "Captain Falcon" via shortName)
    // 3. If no exact matches, do fuzzy matching (e.g., "dream" → "Fountain of Dreams", "Dream Land N64")

    // Check for exact normalized matches first (both value and aliases)
    const exactMatches = enumValues.filter((ev) => {
      if (ev.value === normalizedInput) {
        return true;
      }
      // Check if any of the aliases match
      if (ev.aliases && Array.isArray(ev.aliases)) {
        return ev.aliases.includes(normalizedInput);
      }
      return false;
    });

    if (exactMatches.length > 0) {
      // Return exact matches only (e.g., "falco" matches "Falco" but not "Captain Falcon")
      return exactMatches.map((match) => (match.id !== undefined ? match.id : match.value));
    }

    // No exact matches, try fuzzy matching on labels
    const lowerV = v.toLowerCase();
    const fuzzyMatches = enumValues.filter((ev) => {
      const lowerLabel = ev.label.toLowerCase();
      return lowerLabel.includes(lowerV) || lowerV.includes(lowerLabel);
    });

    if (fuzzyMatches.length > 0) {
      // Return ALL fuzzy matches (e.g., "dream" matches both Dream stages)
      return fuzzyMatches.map((match) => (match.id !== undefined ? match.id : match.value));
    }

    // No matches found
    throw new Error(
      `Invalid value: "${v}" (fuzzy match). Expected one of: ${enumValues
        .slice(0, 5)
        .map((e) => e.value)
        .join(", ")}${enumValues.length > 5 ? "..." : ""}`,
    );
  });

  // Return single value or array
  return parsed.length === 1 ? parsed[0] : parsed;
}

/**
 * Parse boolean value
 *
 * Examples:
 * - "yes" -> true
 * - "no" -> false
 * - "true" -> true
 * - "false" -> false
 * - "1" -> true
 * - "0" -> false
 */
function parseBooleanValue(value: string): boolean {
  const lower = value.toLowerCase();
  if (["yes", "true", "1"].includes(lower)) {
    return true;
  }
  if (["no", "false", "0"].includes(lower)) {
    return false;
  }
  throw new Error(`Invalid boolean value: "${value}". Expected yes/no or true/false`);
}

/**
 * Parse duration into frames (60 fps)
 *
 * Supported formats:
 * - "30s" -> 1800 frames (30 seconds * 60 fps)
 * - "1m" -> 3600 frames (1 minute * 60 seconds * 60 fps)
 * - "1800f" -> 1800 frames (explicit frames)
 * - "90" -> 5400 frames (assumed seconds if no unit)
 *
 * Examples:
 * - parseDuration("30s") -> 1800
 * - parseDuration("1m") -> 3600
 * - parseDuration("2.5m") -> 9000
 * - parseDuration("1800f") -> 1800
 */
function parseDuration(value: string): number {
  const match = value.match(/^(\d+(?:\.\d+)?)(s|m|f)?$/i);
  if (!match) {
    throw new Error(`Invalid duration format: "${value}". Expected format like 30s, 1m, or 1800f`);
  }

  const [, numStr, unit = "s"] = match;
  const num = parseFloat(numStr);

  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid duration number: "${value}"`);
  }

  switch (unit.toLowerCase()) {
    case "s":
      return Math.floor(num * 60); // seconds to frames (60 fps)
    case "m":
      return Math.floor(num * 60 * 60); // minutes to frames
    case "f":
      return Math.floor(num); // already in frames
    default:
      throw new Error(`Unknown duration unit: "${unit}". Use s (seconds), m (minutes), or f (frames)`);
  }
}

/**
 * Parse number value
 *
 * Examples:
 * - "1" -> 1
 * - "42" -> 42
 */
function parseNumber(value: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}
