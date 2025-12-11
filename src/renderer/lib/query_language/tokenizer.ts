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
 * - "NOT char:puff" -> [{ type: "OPERATOR", value: "NOT", position: 0 }, { type: "FILTER", value: "puff", key: "char", position: 4 }]
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

    // Negation operator (- at start of word)
    if (query[i] === "-" && (i === 0 || /\s/.test(query[i - 1]))) {
      // Check if this is a filter expression (e.g., -stage:FD)
      const nextChar = query[i + 1];
      if (nextChar && /[a-zA-Z]/.test(nextChar)) {
        tokens.push({ type: "OPERATOR", value: "NOT", position: i });
        i++;
        continue;
      }
    }

    // NOT operator
    if (query.slice(i, i + 3).toUpperCase() === "NOT" && (i + 3 >= query.length || /\s/.test(query[i + 3]))) {
      tokens.push({ type: "OPERATOR", value: "NOT", position: i });
      i += 3;
      continue;
    }

    // Filter expression (key:value)
    // Match key:value where value can be:
    // - Unquoted: alphanumeric, dash, underscore, hash, comma
    // - Quoted: anything inside quotes
    const filterMatch = query.slice(i).match(/^([a-zA-Z0-9_-]+):("([^"]*)"|([^\s]+))/);
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
