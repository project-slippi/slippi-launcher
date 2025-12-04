import { initTestDb } from "@database/tests/test_db";
import type { Kysely } from "kysely";

import type { Database as DatabaseSchema } from "../schema";
import { applyFilters } from "./apply";
import type { TextSearchFilter } from "./types";

describe("Text Search Filter", () => {
  let db: Kysely<DatabaseSchema>;
  let destroy: () => Promise<void>;

  beforeEach(async () => {
    // initTestDb now runs migrations which create the tables
    const testDb = await initTestDb();
    db = testDb.db;
    destroy = testDb.destroy;

    // Insert test data with non-overlapping search terms
    // Game 1: Has unique connect code "ALFA#0" that doesn't appear anywhere else
    const fileId1 = await db
      .insertInto("file")
      .values({
        name: "game001.slp",
        folder: "/test",
        size_bytes: 1000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Game 2: Has unique display name "Zain" that doesn't appear anywhere else
    const fileId2 = await db
      .insertInto("file")
      .values({
        name: "game002.slp",
        folder: "/test",
        size_bytes: 2000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Game 3: Has unique tag "GG" that doesn't appear anywhere else
    const fileId3 = await db
      .insertInto("file")
      .values({
        name: "game003.slp",
        folder: "/test",
        size_bytes: 3000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Game 4: Has unique filename "tournament_finals" but generic player names
    const fileId4 = await db
      .insertInto("file")
      .values({
        name: "tournament_finals.slp",
        folder: "/test",
        size_bytes: 4000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    const gameId1 = await db
      .insertInto("game")
      .values({
        file_id: fileId1._id,
        mode: 8,
        last_frame: 5000,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    const gameId2 = await db
      .insertInto("game")
      .values({
        file_id: fileId2._id,
        mode: 8,
        last_frame: 3000,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    const gameId3 = await db
      .insertInto("game")
      .values({
        file_id: fileId3._id,
        mode: 8,
        last_frame: 4000,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    const gameId4 = await db
      .insertInto("game")
      .values({
        file_id: fileId4._id,
        mode: 8,
        last_frame: 4500,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Insert players with non-overlapping identifiers
    await db
      .insertInto("player")
      .values([
        // Game 1: Has unique connect code "ALFA#0"
        {
          game_id: gameId1._id,
          port: 1,
          connect_code: "ALFA#0",
          display_name: "PlayerOne",
          tag: "Team1",
        },
        {
          game_id: gameId1._id,
          port: 2,
          connect_code: "BETA#1",
          display_name: "PlayerTwo",
          tag: "Team2",
        },
        // Game 2: Has unique display name "Zain"
        {
          game_id: gameId2._id,
          port: 1,
          connect_code: "CODE#111",
          display_name: "Zain",
          tag: "TeamA",
        },
        {
          game_id: gameId2._id,
          port: 2,
          connect_code: "CODE#222",
          display_name: "PlayerB",
          tag: "TeamB",
        },
        // Game 3: Has unique tag "GG"
        {
          game_id: gameId3._id,
          port: 1,
          connect_code: "TEST#333",
          display_name: "PlayerX",
          tag: "GG",
        },
        {
          game_id: gameId3._id,
          port: 2,
          connect_code: "TEST#444",
          display_name: "PlayerY",
          tag: "EZ",
        },
        // Game 4: Generic player names, searchable only by filename
        {
          game_id: gameId4._id,
          port: 1,
          connect_code: "PLYR#555",
          display_name: "Generic1",
          tag: "Tag1",
        },
        {
          game_id: gameId4._id,
          port: 2,
          connect_code: "PLYR#666",
          display_name: "Generic2",
          tag: "Tag2",
        },
      ])
      .execute();
  });

  afterEach(async () => {
    await destroy();
  });

  it("should generate valid SQL for text search filter", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "mango",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    // This should not throw an error
    const sql = query.selectAll(["file", "game"]).compile();
    expect(sql.sql).toBeTruthy();
    expect(sql.sql.toLowerCase()).toContain("like");
  });

  it("should find games by connect code", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "ALFA",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Should only find game001.slp (ALFA only appears in connect_code)
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("game001.slp");
  });

  it("should find games by display name", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "Zain",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Should only find game002.slp (Zain only appears in display_name)
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("game002.slp");
  });

  it("should find games by tag", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "GG",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Should only find game003.slp (GG only appears in tag)
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("game003.slp");
  });

  it("should find games by filename", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "tournament",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("tournament_finals.slp");
  });

  it("should be case insensitive", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "zain", // lowercase
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Should find game002.slp (Zain is stored with capital Z but search is lowercase)
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("game002.slp");
  });

  it("should not find games that do not match", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "nonexistent",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    expect(results.length).toBe(0);
  });

  it("should only search file name when searchFileNameOnly is true", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "ALFA",
      searchFileNameOnly: true,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Should find nothing (ALFA only appears in connect_code, not filename)
    expect(results.length).toBe(0);
  });

  it("should handle empty query gracefully", async () => {
    const filter: TextSearchFilter = {
      type: "textSearch",
      query: "",
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);

    const results = await query.selectAll(["file", "game"]).execute();

    // Empty query should return all results (no filter applied)
    expect(results.length).toBe(4);
  });
});
