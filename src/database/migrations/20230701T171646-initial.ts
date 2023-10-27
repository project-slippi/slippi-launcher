import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("replay")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("file_name", "text", (col) => col.notNull())
    .addColumn("folder", "text", (col) => col.notNull())
    .addColumn("size_bytes", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("birth_time", "text")
    .execute();

  await db.schema
    .createTable("game")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("replay_id", "integer", (col) => col.references("replay._id").onDelete("cascade").notNull())
    .addColumn("is_teams", "boolean")
    .addColumn("stage", "integer")
    .addColumn("start_time", "text")
    .addColumn("platform", "text")
    .addColumn("console_nickname", "text")
    .addColumn("mode", "integer")
    .addColumn("last_frame", "integer")
    .addColumn("timer_type", "integer")
    .addColumn("starting_timer_secs", "integer")
    .execute();

  // Create indexes
  await db.schema
    .createIndex("replay_folder_file_name_index")
    .on("replay")
    .column("folder")
    .column("file_name")
    .execute();

  await db.schema.createIndex("game_replay_id_index").on("game").column("replay_id").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  db.schema.dropTable("replay");
  db.schema.dropTable("game");
}

export default {
  up,
  down,
};
