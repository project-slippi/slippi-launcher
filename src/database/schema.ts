import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export interface ReplayTable {
  _id: Generated<number>;
  folder: string;
  file_name: string;
  size_bytes: ColumnType<number, number | undefined>;
  birth_time: string | null;
}

export type Replay = Selectable<ReplayTable>;
export type NewReplay = Insertable<ReplayTable>;
export type ReplayUpdate = Updateable<ReplayTable>;

export interface GameTable {
  _id: Generated<number>;
  replay_id: number; // Foreign key
  is_ranked: ColumnType<number, number | undefined>;
  is_teams: ColumnType<number, number | undefined>;
  stage: number | null;
  start_time: string | null;
  platform: string | null;
  console_nickname: string | null;
  mode: number | null;
  last_frame: number | null;
  timer_type: number | null;
  starting_timer_secs: number | null;
  match_id: string | null;
  sequence_number: ColumnType<number, number | undefined>;
  tiebreak_index: ColumnType<number, number | undefined>;
}

export type Game = Selectable<GameTable>;
export type NewGame = Insertable<GameTable>;
export type GameUpdate = Updateable<GameTable>;

export interface PlayerTable {
  _id: Generated<number>;
  game_id: number; // Foreign key
  index: number;
  type: number | null;
  character_id: number | null;
  character_color: number | null;
  team_id: number | null;
  is_winner: number | null;
  start_stocks: number | null;
  connect_code: string | null;
  display_name: string | null;
  tag: string | null;
  user_id: string | null;
}

export type Player = Selectable<PlayerTable>;
export type NewPlayer = Insertable<PlayerTable>;
export type PlayerUpdate = Updateable<PlayerTable>;

export interface Database {
  replay: ReplayTable;
  game: GameTable;
  player: PlayerTable;
}
