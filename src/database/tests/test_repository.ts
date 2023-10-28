import type { Kysely } from "kysely";

import type { Database } from "../schema";

type DB = Kysely<Database>;

export async function clearDatabase(db: DB) {
  await db.deleteFrom("replay").execute();
  await db.deleteFrom("game").execute();
  await db.deleteFrom("player").execute();
}

export async function getRowCount(db: DB, table: keyof Database): Promise<number> {
  const { num_rows } = await db
    .selectFrom(table)
    .select((eb) => eb.fn.countAll<number>().as("num_rows"))
    .executeTakeFirstOrThrow();
  return num_rows;
}
