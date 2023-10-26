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
}

export async function down(db: Kysely<any>): Promise<void> {
  db.schema.dropTable("replay");
}

export default {
  up,
  down,
};
