import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface ReplayTable {
  _id: Generated<number>;
  full_path: string;
  folder: string;
  size_bytes: number;
  birth_time: string | null;
}

export type Replay = Selectable<ReplayTable>;
export type NewReplay = Insertable<ReplayTable>;
export type ReplayUpdate = Updateable<ReplayTable>;

export interface Database {
  replay: ReplayTable;
}
