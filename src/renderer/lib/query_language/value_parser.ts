/**
 * Value Parser
 *
 * Parses and validates values for different filter types.
 * Converts string values into the appropriate types (numbers, enums, durations, etc.)
 */

import type { FilterDefinition } from "./types";

/**
 * Parse a value according to its filter definition
 *
 * @throws Error if value is invalid
 */
export function parseValue(value: string, def: FilterDefinition): any {
  switch (def.valueType) {
    case "enum":
      return parseEnumValue(value, def);

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
 * Examples:
 * - "fox" -> 2 (Fox's character ID)
 * - "fox,falco" -> [2, 20] (Fox and Falco IDs)
 * - "battlefield" -> 31 (Battlefield stage ID)
 */
function parseEnumValue(value: string, def: FilterDefinition): any {
  if (!def.enumValues) {
    throw new Error(`No enum values defined for ${def.key}`);
  }

  // Support comma-separated values
  const values = value.split(",").map((v) => v.trim().toLowerCase());
  const enumValues = def.enumValues;

  const parsed = values.map((v) => {
    // Try exact match first (on value field)
    let match = enumValues.find((ev) => ev.value.toLowerCase() === v);

    // Try fuzzy match on label if no exact match
    if (!match) {
      match = enumValues.find((ev) => ev.label.toLowerCase().includes(v) || v.includes(ev.label.toLowerCase()));
    }

    if (!match) {
      throw new Error(
        `Invalid value: "${v}". Expected one of: ${enumValues
          .slice(0, 5)
          .map((e) => e.value)
          .join(", ")}${enumValues.length > 5 ? "..." : ""}`,
      );
    }

    // Return the ID if available, otherwise the value
    return match.id !== undefined ? match.id : match.value;
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
