import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop the index that references the old column names
  await db.schema.dropIndex("game_match_id_sequence_number_index").execute();

  // Rename the columns
  await db.schema.alterTable("game").renameColumn("match_id", "session_id").execute();
  await db.schema.alterTable("game").renameColumn("sequence_number", "game_number").execute();
  await db.schema.alterTable("game").renameColumn("tiebreak_index", "tiebreak_number").execute();

  // Recreate the index with new column names
  await db.schema
    .createIndex("game_session_id_game_number_index")
    .on("game")
    .column("session_id")
    .column("game_number")
    .execute();

  // Add start_time index for date range queries
  await db.schema.createIndex("game_start_time_index").on("game").column("start_time").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the indexes
  await db.schema.dropIndex("game_session_id_game_number_index").execute();
  await db.schema.dropIndex("game_start_time_index").execute();

  // Rename the columns back to original names
  await db.schema.alterTable("game").renameColumn("session_id", "match_id").execute();
  await db.schema.alterTable("game").renameColumn("game_number", "sequence_number").execute();
  await db.schema.alterTable("game").renameColumn("tiebreak_number", "tiebreak_index").execute();

  // Recreate the original index
  await db.schema
    .createIndex("game_match_id_sequence_number_index")
    .on("game")
    .column("match_id")
    .column("sequence_number")
    .execute();
}
