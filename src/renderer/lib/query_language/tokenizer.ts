/**
 * Tokenizer
 *
 * Breaks down a query string into tokens for parsing.
 * Handles quoted strings, filter expressions (key:value), and operators.
 */

import type { Token } from "./types";

/**
 * Tokenize a query string into an array of tokens
 *
 * Examples:
 * - "mango" -> [{ type: "WORD", value: "mango", position: 0 }]
 * - "stage:FD" -> [{ type: "FILTER", value: "FD", key: "stage", position: 0 }]
 * - '"Liquid Hbox"' -> [{ type: "QUOTED", value: "Liquid Hbox", position: 0 }]
 * - "-char:puff" -> [{ type: "OPERATOR", value: "NOT", position: 0 }, { type: "FILTER", value: "puff", key: "char", position: 1 }]
 */
export function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < query.length) {
    // Skip whitespace
    if (/\s/.test(query[i])) {
      i++;
      continue;
    }

    // Quoted string
    if (query[i] === '"') {
      const start = i;
      i++; // Skip opening quote
      let value = "";
      while (i < query.length && query[i] !== '"') {
        value += query[i];
        i++;
      }
      i++; // Skip closing quote
      tokens.push({ type: "QUOTED", value, position: start });
      continue;
    }

    // Negation operator (- at start of word, only for filter expressions)
    if (query[i] === "-" && (i === 0 || /\s/.test(query[i - 1]))) {
      // Check if this is followed by a filter expression (e.g., -stage:battlefield or -char:falco)
      // Look ahead to see if there's a key:value pattern
      // Note: Filter keys can only contain letters, numbers, and underscores (no dashes)
      const lookAhead = query.slice(i + 1).match(/^([a-zA-Z0-9_]+):/);
      if (lookAhead) {
        tokens.push({ type: "OPERATOR", value: "NOT", position: i });
        i++;
        continue;
      }
    }

    // Check for potential filter-like patterns that aren't valid filters
    // This handles cases like "test-char:fox" where the key contains invalid chars (dash)
    // We want to treat these as plain WORD tokens, not split at the colon
    const potentialFilterMatch = query.slice(i).match(/^([a-zA-Z0-9_-]+):([^\s]+)/);
    if (potentialFilterMatch) {
      const [full, key] = potentialFilterMatch;
      // Check if this key matches our valid filter key pattern (no dashes)
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        // Invalid filter key pattern (e.g., contains dash), treat whole thing as a word
        tokens.push({ type: "WORD", value: full, position: i });
        i += full.length;
        continue;
      }
    }

    // Filter expression (key:value)
    // Match key:value where value can be:
    // - Unquoted: alphanumeric, dash, underscore, hash, comma
    // - Quoted: anything inside quotes
    // Note: Filter keys can only contain letters, numbers, and underscores (no dashes in keys)
    const filterMatch = query.slice(i).match(/^([a-zA-Z0-9_]+):("([^"]*)"|([^\s]+))/);
    if (filterMatch) {
      const [full, key, , quotedValue, unquotedValue] = filterMatch;
      const value = quotedValue !== undefined ? quotedValue : unquotedValue;
      const valueWasQuoted = quotedValue !== undefined;
      tokens.push({ type: "FILTER", value, key, position: i, valueWasQuoted });
      i += full.length;
      continue;
    }

    // Regular word (search text)
    const wordMatch = query.slice(i).match(/^[^\s:]+/);
    if (wordMatch) {
      tokens.push({ type: "WORD", value: wordMatch[0], position: i });
      i += wordMatch[0].length;
      continue;
    }

    // Unknown character, skip
    i++;
  }

  return tokens;
}
