/**
 * Filter Schema
 *
 * Defines all available filters, their types, and validation rules.
 * This schema is used for:
 * - Parsing and validation
 * - Auto-complete suggestions (future)
 * - Help documentation generation (future)
 */

import { characters, stages } from "@slippi/slippi-js";

import type { FilterDefinition } from "./types";

/**
 * Normalize a string for matching stage/character names
 * - Converts to lowercase
 * - Removes diacritics (é → e, ō → o, etc.)
 * - Replaces spaces with underscores
 * - Removes apostrophes and special characters
 *
 * Examples:
 * - "Pokémon Stadium" → "pokemon_stadium"
 * - "Fountain of Dreams" → "fountain_of_dreams"
 * - "Yoshi's Story" → "yoshis_story"
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
 * All available filter definitions
 */
export const FILTER_SCHEMA: FilterDefinition[] = [
  {
    key: "minDuration",
    aliases: ["minLength"],
    description: "Minimum game duration",
    valueType: "duration",
    examples: ["minDuration:30s", "minDuration:1m", "minDuration:1800f"],
    category: "game",
  },
  {
    key: "maxDuration",
    aliases: ["maxLength"],
    description: "Maximum game duration",
    valueType: "duration",
    examples: ["maxDuration:5m", "maxDuration:300s"],
    category: "game",
  },
  {
    key: "character",
    aliases: ["char"],
    description: "Character used by any player",
    valueType: "enum",
    enumValues: characters.getAllCharacters().map((char) => ({
      value: normalizeString(char.name),
      label: char.name,
      id: char.id,
      aliases: char.shortName ? [normalizeString(char.shortName)] : [],
    })),
    examples: ["char:fox", "character:falco", "char:ice_climbers"],
    category: "player",
  },
  {
    key: "stage",
    description: "Stage the game was played on",
    valueType: "enum",
    enumValues: stages.getStages("vs").map((stage) => ({
      value: normalizeString(stage.name),
      label: stage.name,
      id: stage.id,
    })),
    examples: ["stage:battlefield", "stage:final_destination", "stage:pokemon_stadium"],
    category: "game",
  },
  {
    key: "code",
    description: "Player's connect code",
    valueType: "string",
    examples: ["code:MANG#0", "code:HBOX#0"],
    category: "player",
  },
  {
    key: "tag",
    aliases: ["name"],
    description: "Player's in-game tag or display name",
    valueType: "string",
    examples: ["tag:Mango", 'name:"Liquid Hbox"'],
    category: "player",
  },
  {
    key: "winner",
    description: "Player who won the game (connect code or tag)",
    valueType: "string",
    examples: ["winner:MANG#0", 'winner:"Liquid Hbox"'],
    category: "player",
  },
  {
    key: "port",
    aliases: ["p1", "p2", "p3", "p4"],
    description: "Filter by port number (1-4)",
    valueType: "number",
    examples: ["port:1", "port:2"],
    category: "player",
  },
];

/**
 * Build lookup map for fast access
 * Maps both primary keys and aliases to their filter definitions
 */
export const FILTER_KEY_MAP = new Map<string, FilterDefinition>();

FILTER_SCHEMA.forEach((def) => {
  FILTER_KEY_MAP.set(def.key.toLowerCase(), def);
  def.aliases?.forEach((alias) => FILTER_KEY_MAP.set(alias.toLowerCase(), def));
});

// Add port aliases (p1, p2, p3, p4) with port numbers embedded
const portFilter = FILTER_SCHEMA.find((f) => f.key === "port");
if (portFilter) {
  ["p1", "p2", "p3", "p4"].forEach((alias) => {
    FILTER_KEY_MAP.set(alias.toLowerCase(), {
      ...portFilter,
      key: alias,
      // Store the port number in a way we can retrieve it
      examples: [`${alias}:fox`],
    });
  });
}

/**
 * Get filter definition by key (case-insensitive)
 */
export function getFilterDefinition(key: string): FilterDefinition | undefined {
  return FILTER_KEY_MAP.get(key.toLowerCase());
}

/**
 * Extract port number from port alias (p1, p2, etc.)
 */
export function getPortFromAlias(key: string): number | undefined {
  const lower = key.toLowerCase();
  if (lower === "p1") {
    return 1;
  }
  if (lower === "p2") {
    return 2;
  }
  if (lower === "p3") {
    return 3;
  }
  if (lower === "p4") {
    return 4;
  }
  return undefined;
}
