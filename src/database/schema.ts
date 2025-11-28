import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

/**
 * File table schema
 *
 * Indexes:
 * - file_folder_name_index: (folder, name) - For folder/name lookups and queries
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
 * Indexes:
 * - game_file_id_index: (file_id) - For file/folder joins and lookups
 * - game_session_id_game_number_index: (session_id, game_number) - For session grouping and ordering games within sessions
 * - game_start_time_index: (start_time) - For date range queries and temporal filtering
 */
export type GameTable = {
  _id: Generated<number>;
  file_id: number; // Foreign key to file._id, indexed
  is_ranked: ColumnType<number, number | undefined>;
  is_teams: ColumnType<number, number | undefined>;
  stage: number | null;
  start_time: string | null; // Indexed for date range queries
  platform: string | null;
  console_nickname: string | null;
  mode: number | null;
  last_frame: number | null;
  timer_type: number | null;
  starting_timer_secs: number | null;
  session_id: string | null; // Part of composite index; NULL means single-game session
  game_number: ColumnType<number, number | undefined>; // Part of composite index
  tiebreak_number: ColumnType<number, number | undefined>;
};

export type GameRecord = Selectable<GameTable>;
export type NewGame = Insertable<GameTable>;
export type GameUpdate = Updateable<GameTable>;

/**
 * Player table schema
 *
 * Indexes:
 * - player_game_id_index: (game_id, index) - For player lookups by game and player index
 * - player_user_id_index: (user_id) - For filtering games by user/player
 *
 * Unique Constraints:
 * - unique_game_id_index_constraint: (game_id, index) - Ensures unique player index per game
 */
export type PlayerTable = {
  _id: Generated<number>;
  game_id: number; // Foreign key to game._id, indexed
  index: number; // Part of composite index and unique constraint
  type: number | null;
  character_id: number | null;
  character_color: number | null;
  team_id: number | null;
  is_winner: number | null;
  start_stocks: number | null;
  connect_code: string | null;
  display_name: string | null;
  tag: string | null;
  user_id: string | null; // Indexed for user filtering
};

export type PlayerRecord = Selectable<PlayerTable>;
export type NewPlayer = Insertable<PlayerTable>;
export type PlayerUpdate = Updateable<PlayerTable>;

export type Database = {
  file: FileTable;
  game: GameTable;
  player: PlayerTable;
};
