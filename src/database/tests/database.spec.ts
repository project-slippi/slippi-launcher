import { createDatabase } from "database/create_database";
import type { Database } from "database/schema";
import type { Kysely } from "kysely";

import * as ReplayRepository from "../repositories/replay_repository";

describe("when validating display names", () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = await createDatabase();
  });

  afterEach(async () => {
    // Clear the database after each test
    await db.deleteFrom("replay").execute();
    await db.deleteFrom("game").execute();
    await db.deleteFrom("player").execute();
  });

  it("should disallow replays with the same folder and filename", async () => {
    await ReplayRepository.insertReplay(db, { folder: "folder", file_name: "name", size_bytes: 10 });
    await ReplayRepository.insertReplay(db, { folder: "folder", file_name: "different_name", size_bytes: 10 });
    await ReplayRepository.insertReplay(db, { folder: "different_folder", file_name: "name", size_bytes: 10 });

    const { num_rows } = await db
      .selectFrom("replay")
      .select((eb) => eb.fn.countAll<number>().as("num_rows"))
      .executeTakeFirstOrThrow();
    expect(num_rows).toEqual(3);

    const result = ReplayRepository.insertReplay(db, { folder: "folder", file_name: "name", size_bytes: 10 });
    await expect(result).rejects.toThrowError();
  });
});
