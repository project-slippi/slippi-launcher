import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("replay")
    .addColumn("_id", "integer", (col) => col.primaryKey())
    .addColumn("full_path", "text", (col) => col.notNull().unique())
    .addColumn("folder", "text", (col) => col.notNull())
    .addColumn("size_bytes", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("birth_time", "text")
    .execute();

  await db.schema.createIndex("replay_full_path_index").on("replay").column("full_path").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  db.schema.dropTable("replay");
}

export default {
  up,
  down,
};
