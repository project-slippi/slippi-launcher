import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("replay")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("folder", "text", (col) => col.notNull())
    .addColumn("file_name", "text", (col) => col.notNull())
    .addColumn("size_bytes", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("birth_time", "text")
    .addUniqueConstraint("unique_folder_file_name_constraint", ["folder", "file_name"])
    .execute();

  await db.schema
    .createTable("game")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("replay_id", "integer", (col) => col.references("replay._id").onDelete("cascade").notNull())
    .addColumn("is_ranked", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("is_teams", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("stage", "integer")
    .addColumn("start_time", "text")
    .addColumn("platform", "text")
    .addColumn("console_nickname", "text")
    .addColumn("mode", "integer")
    .addColumn("last_frame", "integer")
    .addColumn("timer_type", "integer")
    .addColumn("starting_timer_secs", "integer")
    .addColumn("match_id", "text")
    .addColumn("sequence_number", "integer", (col) => col.defaultTo(1).notNull())
    .addColumn("tiebreak_index", "integer", (col) => col.defaultTo(0).notNull())
    .execute();

  await db.schema
    .createTable("player")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("game_id", "integer", (col) => col.references("game._id").onDelete("cascade").notNull())
    .addColumn("index", "integer", (col) => col.notNull())
    .addColumn("type", "integer")
    .addColumn("character_id", "integer")
    .addColumn("character_color", "integer")
    .addColumn("team_id", "integer")
    .addColumn("is_winner", "integer")
    .addColumn("start_stocks", "integer")
    .addColumn("connect_code", "text")
    .addColumn("display_name", "text")
    .addColumn("tag", "text")
    .addColumn("user_id", "text")
    .addUniqueConstraint("unique_game_id_index_constraint", ["game_id", "index"])
    .execute();

  // Create indexes
  await db.schema
    .createIndex("replay_folder_file_name_index")
    .on("replay")
    .column("folder")
    .column("file_name")
    .execute();
  await db.schema.createIndex("game_replay_id_index").on("game").column("replay_id").execute();
  await db.schema
    .createIndex("game_match_id_sequence_number_index")
    .on("game")
    .column("match_id")
    .column("sequence_number")
    .execute();
  await db.schema.createIndex("player_game_id_index").on("player").column("game_id").execute();
  await db.schema.createIndex("player_user_id_index").on("player").column("user_id").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("replay").execute();
  await db.schema.dropTable("game").execute();
  await db.schema.dropTable("players").execute();

  await db.schema.dropIndex("replay_folder_file_name_index").execute();
  await db.schema.dropIndex("game_replay_id_index").execute();
  await db.schema.dropIndex("game_match_id_sequence_number_index").execute();
  await db.schema.dropIndex("player_game_id_index").execute();
  await db.schema.dropIndex("player_user_id_index").execute();
}
