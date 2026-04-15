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

import { CHARACTER_ALIASES, STAGE_ALIASES } from "./aliases";
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
    key: "duration",
    aliases: ["length"],
    description: "Game duration",
    valueType: "duration",
    examples: ["duration:>30s", "duration:<4m", "duration:30s", "duration:1m", "duration:1800f"],
    category: "game",
  },
  {
    key: "character",
    aliases: ["char"],
    description: "Character used by any player",
    valueType: "enum",
    enumValues: characters.getAllCharacters().map((char) => {
      const aliases = CHARACTER_ALIASES.get(char.id) || [];
      if (char.shortName && char.shortName !== char.name) {
        aliases.push(char.shortName);
      }
      return {
        value: normalizeString(char.name),
        label: char.name,
        id: char.id,
        aliases: aliases.map(normalizeString),
      };
    }),
    examples: ["char:fox", "character:falco", "char:ice_climbers"],
    category: "player",
  },
  {
    key: "stage",
    description: "Stage the game was played on",
    valueType: "enum",
    enumValues: stages.getStages("vs").map((stage) => {
      const aliases = STAGE_ALIASES.get(stage.id) || [];
      return {
        value: normalizeString(stage.name),
        label: stage.name,
        id: stage.id,
        aliases: aliases.map(normalizeString),
      };
    }),
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
    key: "loser",
    description: "Player who lost the game (connect code or tag)",
    valueType: "string",
    examples: ["loser:MANG#0", 'loser:"Liquid Hbox"'],
    category: "player",
  },
  {
    key: "date",
    description: "Game start date (YYYY, YYYY-MM, or YYYY-MM-DD format)",
    valueType: "date",
    examples: ["date:2026", "date:2025-02", "date:2024-01-15", "date:>2025-02", "date:<2025-06", "date:>=2024-01-01"],
    category: "date",
  },
  {
    key: "is",
    description: "Game type filter (ranked, unranked, teams, doubles, singles)",
    valueType: "enum",
    enumValues: [
      { value: "ranked", label: "Ranked", aliases: [], id: "ranked" },
      { value: "unranked", label: "Unranked", aliases: [], id: "unranked" },
      { value: "singles", label: "Singles", aliases: [], id: "singles" },
      { value: "doubles", label: "Doubles", aliases: ["teams"], id: "doubles" },
    ],
    examples: ["is:ranked", "-is:ranked", "is:teams", "is:doubles", "is:singles", "-is:teams"],
    category: "game",
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

/**
 * Get filter definition by key (case-insensitive)
 */
export function getFilterDefinition(key: string): FilterDefinition | undefined {
  return FILTER_KEY_MAP.get(key.toLowerCase());
}
