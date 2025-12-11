/**
 * Filter for game duration (in frames, 60 fps)
 *
 * Examples:
 * - { minFrames: 1800 } = at least 30 seconds
 * - { maxFrames: 18000 } = at most 5 minutes
 * - { minFrames: 1800, maxFrames: 18000 } = between 30s and 5min
 */
export type DurationFilter = {
  type: "duration";
  minFrames?: number;
  maxFrames?: number;
};

/**
 * Filter for player participation
 *
 * At least one of the identifier fields must be provided.
 * All specified fields are combined with AND logic - they must all match the same player.
 *
 * Examples:
 * - { connectCode: "MANG#0" } = games with a player who has connect code MANG#0
 * - { connectCode: "MANG#0", mustBeWinner: true } = games where MANG#0 won
 * - { connectCode: "MANG#0", port: 1, mustBeWinner: true } = games where MANG#0 was port 1 and won
 * - { connectCode: "MANG#0", characterIds: [2, 20], mustBeWinner: true } = games where MANG#0 played Fox or Falco and won
 * - { port: 1 } = games where port 1 exists (any player)
 * - { tag: "aklo", tagFuzzy: true } = games where tag contains "aklo" (fuzzy LIKE match)
 * - { tag: "aklo", tagFuzzy: false } = games where tag exactly equals "aklo" (exact = match)
 */
export type PlayerFilter = {
  type: "player";
  // Player identifiers (all use AND logic)
  connectCode?: string;
  userId?: string;
  displayName?: string;
  tag?: string;
  port?: number; // Port number (1-4)
  characterIds?: number[]; // Character IDs (OR logic - player played any of these characters)
  // Optional win condition
  mustBeWinner?: boolean;
  // Fuzzy matching flags (true = use LIKE with %, false/undefined = exact match with =)
  tagFuzzy?: boolean;
  displayNameFuzzy?: boolean;
};

/**
 * Filter for game mode. Game mode values are from @slippi/slippi-js GameMode enum.
 *
 * Examples:
 * - { modes: [8] } = online games only
 * - { modes: [2, 8] } = vs or online
 * - { modes: [15, 32] } = stadium modes only
 */
export type GameModeFilter = {
  type: "gameMode";
  modes: number[];
};

/**
 * Filter for general text searching across replay data
 *
 * Uses SQL LIKE for case-insensitive fuzzy matching (case-insensitive by default in SQLite).
 * Searches across ALL player fields (connect code, display name, tag) and file names.
 * Returns a match if the query appears in ANY of these fields.
 *
 * This is distinct from PlayerFilter in that:
 * - PlayerFilter: Structured queries with exact matching and AND logic for specific players
 * - TextSearchFilter: Quick fuzzy search with OR logic across all searchable fields
 *
 * Examples:
 * - { query: "mango" } = fuzzy search for "mango" in all player fields and file names
 * - { query: "FOO#123" } = fuzzy search, would match "FOO#1234" or "FOO#123"
 * - { query: "game_20231201", searchFileNameOnly: true } = search only file names
 */
export type TextSearchFilter = {
  type: "textSearch";
  query: string;
  // Optional: if true, only search file names (not player fields)
  searchFileNameOnly?: boolean;
};

export type ReplayFilter = DurationFilter | PlayerFilter | GameModeFilter | TextSearchFilter;

// Game mode constants
const GameModeValue = {
  VS: 2,
  ONLINE: 8,
  TARGET_TEST: 15,
  HOME_RUN_CONTEST: 32,
} as const;

/**
 * Stadium game modes (Home Run Contest, Target Test) that should be excluded from duration filtering
 */
export const STADIUM_GAME_MODES = [GameModeValue.HOME_RUN_CONTEST, GameModeValue.TARGET_TEST];
