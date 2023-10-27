import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface ReplayTable {
  _id: Generated<number>;
  file_name: string;
  folder: string;
  size_bytes: number;
  birth_time: string | null;
}

export type Replay = Selectable<ReplayTable>;
export type NewReplay = Insertable<ReplayTable>;
export type ReplayUpdate = Updateable<ReplayTable>;

export interface GameTable {
  _id: Generated<number>;
  replay_id: number; // Foreign key
  is_teams: number | null;
  stage: number | null;
  start_time: string | null;
  platform: string | null;
  console_nickname: string | null;
  mode: number | null;
  last_frame: number | null;
  timer_type: number | null;
  starting_timer_secs: number | null;
}

export type Game = Selectable<GameTable>;
export type NewGame = Insertable<GameTable>;
export type GameUpdate = Updateable<GameTable>;

export interface Database {
  replay: ReplayTable;
  game: GameTable;
}
