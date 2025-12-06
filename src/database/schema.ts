/**
 * Slippi Replay Database Schema
 *
 * Structure:
 * - file (1) ← game (1) ← player (many)
 * - One file contains one game (enforced by unique constraint on game.file_id)
 * - One game has 2-4 players
 *
 * Boolean Fields:
 * - SQLite stores booleans as integers: 0 = false, 1 = true
 * - Use SQLiteBoolean and SQLiteBooleanNullable type aliases for clarity
 * - Fields: is_ranked, is_teams, is_winner
 *
 * Session Handling:
 * - session_id groups games into sessions (no FK for flexibility)
 * - NULL session_id = standalone game
 * - Non-NULL session_id = part of a session/set
 *
 * Indexes:
 * - See JSDoc comments on each table type
 */
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

/**
 * SQLite Boolean type (non-nullable with default)
 *
 * SQLite doesn't have a native boolean type, so we store them as integers.
 * - Reading: Returns 0 or 1
 * - Writing: Accepts 0, 1, or undefined (uses default)
 *
 * Database: 0 = false, 1 = true
 * Note: Must use 0 or 1, not boolean, due to kysely-sqlite-worker limitations.
 *       Use boolToInt() helper function to convert booleans.
 */
export type SQLiteBoolean = ColumnType<0 | 1, 0 | 1 | undefined, 0 | 1>;

/**
 * SQLite Boolean type (nullable)
 *
 * Same as SQLiteBoolean but allows NULL values.
 * - Reading: Returns 0, 1, or null
 * - Writing: Accepts 0, 1, null, or undefined
 *
 * Database: 0 = false, 1 = true, NULL = unknown/not applicable
 * Note: Must use 0 or 1, not boolean, due to kysely-sqlite-worker limitations.
 *       Use boolToIntOrNull() helper function to convert booleans.
 */
export type SQLiteBooleanOrNull = ColumnType<0 | 1 | null, 0 | 1 | null | undefined, 0 | 1 | null>;

/**
 * File table schema
 *
 * Represents a .slp replay file on disk.
 * One file contains exactly one game.
 *
 * Indexes:
 * - (folder, name) - Created automatically by unique_folder_name_constraint
 *
 * Unique Constraints:
 * - unique_folder_name_constraint: (folder, name) - Prevents duplicate files
 */
export type FileTable = {
  _id: Generated<number>;
  folder: string; // Indexed as part of composite
  name: string; // Indexed as part of composite
  size_bytes: ColumnType<number, number | undefined>;
  birth_time: string | null;
};

export type FileRecord = Selectable<FileTable>;
export type NewFile = Insertable<FileTable>;
export type FileUpdate = Updateable<FileTable>;

/**
 * Game table schema
 *
 * Represents a single game/match from a replay file.
 * One game belongs to exactly one file (1:1 relationship enforced by unique constraint).
 *
 * Indexes:
 * - (file_id) - Created automatically by UNIQUE constraint (for file/folder joins)
 * - game_session_id_game_number_index: (session_id, game_number) - For session grouping and ordering games within sessions
 * - game_start_time_index: (start_time) - For date range queries and temporal filtering
 *
 * Unique Constraints:
 * - file_id - Enforces 1:1 relationship with file table
 */
export type GameTable = {
  _id: Generated<number>;
  file_id: number; // Foreign key to file._id, indexed, UNIQUE (1:1 relationship)
  is_ranked: SQLiteBoolean; // Boolean: 0=unranked, 1=ranked
  is_teams: SQLiteBoolean; // Boolean: 0=singles, 1=teams
  stage: number | null;
  start_time: string | null; // Indexed for date range queries, ISO 8601 format
  platform: string | null; // e.g., "dolphin", "console", "nintendont"
  console_nickname: string | null;
  mode: number | null; // Game mode: 2=VS, 8=ONLINE, 15=TARGET_TEST, 32=HOME_RUN_CONTEST
  last_frame: number | null; // Duration in frames (60fps)
  timer_type: number | null;
  starting_timer_secs: number | null;
  session_id: string | null; // Part of composite index; NULL means single-game session
  game_number: ColumnType<number, number | undefined>; // Part of composite index; game sequence in session
  tiebreak_number: ColumnType<number, number | undefined>; // Tiebreaker game number
};

export type GameRecord = Selectable<GameTable>;
export type NewGame = Insertable<GameTable>;
export type GameUpdate = Updateable<GameTable>;

/**
 * Player table schema
 *
 * Represents a player in a game. Each game has 2-4 players.
 *
 * Indexes:
 * - (game_id, port) - Created automatically by unique_game_id_port_constraint
 * - player_user_id_index: (user_id) - For filtering games by user/player
 *
 * Unique Constraints:
 * - unique_game_id_port_constraint: (game_id, port) - Ensures unique port per game
 */
export type PlayerTable = {
  _id: Generated<number>;
  game_id: number; // Foreign key to game._id, indexed
  port: number; // Port number (1-4), part of composite index and unique constraint
  type: number | null; // Player type (human, CPU, etc.)
  character_id: number | null; // Character ID from Slippi
  character_color: number | null; // Character color/costume
  team_id: number | null; // Team ID for team games
  is_winner: SQLiteBooleanOrNull; // Boolean: 0=lost, 1=won, NULL=unknown/in-progress
  start_stocks: number | null; // Starting stock count
  connect_code: string | null; // Slippi connect code (e.g., "MANG#0")
  display_name: string | null; // Player display name
  tag: string | null; // In-game player tag
  user_id: string | null; // Indexed for user filtering; Slippi user ID
};

export type PlayerRecord = Selectable<PlayerTable>;
export type NewPlayer = Insertable<PlayerTable>;
export type PlayerUpdate = Updateable<PlayerTable>;

export type Database = {
  file: FileTable;
  game: GameTable;
  player: PlayerTable;
};
