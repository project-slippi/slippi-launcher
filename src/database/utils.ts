/**
 * Database utility functions
 */

/**
 * Convert boolean to SQLite integer (0 or 1)
 * Handles undefined by passing it through
 */
export function boolToInt(value: boolean | undefined): 0 | 1 | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value ? 1 : 0;
}

/**
 * Convert boolean to SQLite integer (0 or 1), with null support
 * Handles undefined and null by passing them through
 */
export function boolToIntOrNull(value: boolean | null | undefined): 0 | 1 | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return value ? 1 : 0;
}

/**
 * Recursively converts all boolean values in an object to 0/1
 * Useful for preparing data for database insertion
 *
 * @example
 * ```typescript
 * const data = convertBooleans({
 *   is_ranked: true,  // becomes 1
 *   is_teams: false,  // becomes 0
 *   stage: 2,         // unchanged
 * });
 * ```
 */
export function convertBooleans<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "boolean") {
      result[key] = value ? 1 : 0;
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = convertBooleans(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
