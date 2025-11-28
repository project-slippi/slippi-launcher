import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // SQLite doesn't support ALTER TABLE ADD CONSTRAINT directly
  // We need to recreate the table with the constraint

  // Step 1: Create a temporary table with the same structure but with unique constraint
  await db.schema
    .createTable("game_new")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("file_id", "integer", (col) => col.references("file._id").onDelete("cascade").notNull().unique())
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
    .addColumn("session_id", "text")
    .addColumn("game_number", "integer", (col) => col.defaultTo(1).notNull())
    .addColumn("tiebreak_number", "integer", (col) => col.defaultTo(0).notNull())
    .execute();

  // Step 2: Copy data from old table to new table
  await db
    .insertInto("game_new")
    .columns([
      "_id",
      "file_id",
      "is_ranked",
      "is_teams",
      "stage",
      "start_time",
      "platform",
      "console_nickname",
      "mode",
      "last_frame",
      "timer_type",
      "starting_timer_secs",
      "session_id",
      "game_number",
      "tiebreak_number",
    ])
    .expression((eb) =>
      eb
        .selectFrom("game")
        .select([
          "_id",
          "file_id",
          "is_ranked",
          "is_teams",
          "stage",
          "start_time",
          "platform",
          "console_nickname",
          "mode",
          "last_frame",
          "timer_type",
          "starting_timer_secs",
          "session_id",
          "game_number",
          "tiebreak_number",
        ]),
    )
    .execute();

  // Step 3: Drop old table
  await db.schema.dropTable("game").execute();

  // Step 4: Rename new table to original name
  await db.schema.alterTable("game_new").renameTo("game").execute();

  // Step 5: Recreate indexes
  await db.schema.createIndex("game_file_id_index").on("game").column("file_id").execute();

  await db.schema
    .createIndex("game_session_id_game_number_index")
    .on("game")
    .column("session_id")
    .column("game_number")
    .execute();

  await db.schema.createIndex("game_start_time_index").on("game").column("start_time").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // To rollback, we need to recreate the table without the unique constraint

  // Step 1: Create temporary table without unique constraint
  await db.schema
    .createTable("game_old")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("file_id", "integer", (col) => col.references("file._id").onDelete("cascade").notNull())
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
    .addColumn("session_id", "text")
    .addColumn("game_number", "integer", (col) => col.defaultTo(1).notNull())
    .addColumn("tiebreak_number", "integer", (col) => col.defaultTo(0).notNull())
    .execute();

  // Step 2: Copy data
  await db
    .insertInto("game_old")
    .columns([
      "_id",
      "file_id",
      "is_ranked",
      "is_teams",
      "stage",
      "start_time",
      "platform",
      "console_nickname",
      "mode",
      "last_frame",
      "timer_type",
      "starting_timer_secs",
      "session_id",
      "game_number",
      "tiebreak_number",
    ])
    .expression((eb) =>
      eb
        .selectFrom("game")
        .select([
          "_id",
          "file_id",
          "is_ranked",
          "is_teams",
          "stage",
          "start_time",
          "platform",
          "console_nickname",
          "mode",
          "last_frame",
          "timer_type",
          "starting_timer_secs",
          "session_id",
          "game_number",
          "tiebreak_number",
        ]),
    )
    .execute();

  // Step 3: Drop current table
  await db.schema.dropTable("game").execute();

  // Step 4: Rename old table to original name
  await db.schema.alterTable("game_old").renameTo("game").execute();

  // Step 5: Recreate indexes
  await db.schema.createIndex("game_file_id_index").on("game").column("file_id").execute();

  await db.schema
    .createIndex("game_session_id_game_number_index")
    .on("game")
    .column("session_id")
    .column("game_number")
    .execute();

  await db.schema.createIndex("game_start_time_index").on("game").column("start_time").execute();
}
