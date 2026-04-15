import { initTestDb } from "@database/tests/init_test_db";
import type { Kysely } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Database as DatabaseSchema } from "../schema";
import { applyFilters, DURATION_OFFSET } from "./apply";
import type { DurationFilter, PlayerFilter, StageFilter, TextSearchFilter } from "./types";

describe("Text Search Filter", () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(async () => {
    db = await initTestDb();
    await insertMockData(db);
  });

  afterEach(async () => {
    await db.destroy();
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

async function insertMockData(db: Kysely<DatabaseSchema>) {
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
}

describe("Filter Negation", () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(async () => {
    db = await initTestDb();
    await insertMockDataWithCharacters(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should exclude games with specific character when negated", async () => {
    // Without negation: should find games with Marth (character ID 9)
    const normalFilter: PlayerFilter = {
      type: "player",
      characterIds: [9], // Marth
    };

    let query1 = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query1 = applyFilters(query1, [normalFilter]);
    const normalResults = await query1.selectAll(["file", "game"]).execute();
    expect(normalResults.length).toBeGreaterThan(0);

    // With negation: should exclude games with Marth
    const negatedFilter: PlayerFilter = {
      type: "player",
      characterIds: [9], // Marth
      negate: true,
    };

    let query2 = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query2 = applyFilters(query2, [negatedFilter]);
    const negatedResults = await query2.selectAll(["file", "game"]).execute();

    // Total games should equal normal + negated
    const query3 = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    const allResults = await query3.selectAll(["file", "game"]).execute();
    expect(normalResults.length + negatedResults.length).toBe(allResults.length);

    // Negated results should not contain any games from normal results
    const normalFileIds = normalResults.map((r) => r._id);
    const negatedFileIds = negatedResults.map((r) => r._id);
    const overlap = normalFileIds.filter((id) => negatedFileIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("should exclude games on specific stage when negated", async () => {
    const negatedFilter: StageFilter = {
      type: "stage",
      stageIds: [31], // Battlefield
      negate: true,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [negatedFilter]);
    const results = await query.selectAll(["file", "game"]).execute();

    // Verify none of the results are on Battlefield
    results.forEach((result) => {
      expect(result.stage).not.toBe(31);
    });
  });

  it("should exclude games matching text search when negated", async () => {
    const negatedFilter: TextSearchFilter = {
      type: "textSearch",
      query: "MARTH",
      negate: true,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [negatedFilter]);
    const results = await query.selectAll(["file", "game"]).execute();

    // Verify none of the results contain "MARTH" in connect_code
    // (We set up test data where "MARTH" only appears in connect_code)
    for (const result of results) {
      const players = await db.selectFrom("player").where("game_id", "=", result._id).selectAll().execute();

      const hasMarth = players.some(
        (p) => p.connect_code?.includes("MARTH") || p.display_name?.includes("MARTH") || p.tag?.includes("MARTH"),
      );
      expect(hasMarth).toBe(false);
    }
  });

  it("should combine positive and negative filters", async () => {
    // Find games with Fox (character ID 2) but not on Battlefield (stage ID 31)
    const filters = [
      {
        type: "player" as const,
        characterIds: [2], // Fox
      },
      {
        type: "stage" as const,
        stageIds: [31], // Battlefield
        negate: true,
      },
    ];

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, filters);
    const results = await query.selectAll(["file", "game"]).execute();

    // Verify all results:
    // 1. Have at least one player with Fox (character ID 2)
    // 2. Are not on Battlefield (stage ID 31)
    for (const result of results) {
      expect(result.stage).not.toBe(31);

      const players = await db.selectFrom("player").where("game_id", "=", result._id).selectAll().execute();

      const hasFox = players.some((p) => p.character_id === 2);
      expect(hasFox).toBe(true);
    }
  });
});

async function insertMockDataWithCharacters(db: Kysely<DatabaseSchema>) {
  // Game 1: Fox vs Marth on Battlefield
  const fileId1 = await db
    .insertInto("file")
    .values({
      name: "fox_vs_marth_bf.slp",
      folder: "/test",
      size_bytes: 1000,
      birth_time: null,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  const gameId1 = await db
    .insertInto("game")
    .values({
      file_id: fileId1._id,
      mode: 8,
      stage: 31, // Battlefield
      last_frame: 5000,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("player")
    .values([
      {
        game_id: gameId1._id,
        port: 1,
        connect_code: "FOX#123",
        character_id: 2, // Fox
        display_name: "Player1",
        tag: "FOX",
      },
      {
        game_id: gameId1._id,
        port: 2,
        connect_code: "MARTH#456",
        character_id: 9, // Marth
        display_name: "Player2",
        tag: "MARTH",
      },
    ])
    .execute();

  // Game 2: Falco vs Sheik on Final Destination
  const fileId2 = await db
    .insertInto("file")
    .values({
      name: "falco_vs_sheik_fd.slp",
      folder: "/test",
      size_bytes: 2000,
      birth_time: null,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  const gameId2 = await db
    .insertInto("game")
    .values({
      file_id: fileId2._id,
      mode: 8,
      stage: 32, // Final Destination
      last_frame: 4000,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("player")
    .values([
      {
        game_id: gameId2._id,
        port: 1,
        connect_code: "FALCO#789",
        character_id: 20, // Falco
        display_name: "Player3",
        tag: "FALCO",
      },
      {
        game_id: gameId2._id,
        port: 2,
        connect_code: "SHEIK#101",
        character_id: 19, // Sheik
        display_name: "Player4",
        tag: "SHEIK",
      },
    ])
    .execute();

  // Game 3: Fox vs Falco on Yoshis Story
  const fileId3 = await db
    .insertInto("file")
    .values({
      name: "fox_vs_falco_yoshi.slp",
      folder: "/test",
      size_bytes: 3000,
      birth_time: null,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  const gameId3 = await db
    .insertInto("game")
    .values({
      file_id: fileId3._id,
      mode: 8,
      stage: 8, // Yoshi's Story
      last_frame: 3500,
    })
    .returning("_id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("player")
    .values([
      {
        game_id: gameId3._id,
        port: 1,
        connect_code: "FOX#999",
        character_id: 2, // Fox
        display_name: "Player5",
        tag: "FOX",
      },
      {
        game_id: gameId3._id,
        port: 2,
        connect_code: "FALCO#888",
        character_id: 20, // Falco
        display_name: "Player6",
        tag: "FALCO",
      },
    ])
    .execute();
}

describe("Duration Filter", () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(async () => {
    db = await initTestDb();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should filter games by minimum duration accounting for offset", async () => {
    // User searches for 30s (1800 frames)
    // Backend applies: last_frame >= 1800 + DURATION_OFFSET = 1800 - 123 = 1777
    // So raw last_frame must be >= 1777 to be included
    const userSearchFrames = 1800;
    const minRawFrame = userSearchFrames + DURATION_OFFSET;

    const fileId1 = await db
      .insertInto("file")
      .values({
        name: "just_under.slp",
        folder: "/test",
        size_bytes: 1000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId2 = await db
      .insertInto("file")
      .values({
        name: "at_boundary.slp",
        folder: "/test",
        size_bytes: 2000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId3 = await db
      .insertInto("file")
      .values({
        name: "just_over.slp",
        folder: "/test",
        size_bytes: 3000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Game at boundary: last_frame = 1777 should be included (1777 >= 1777)
    await db.insertInto("game").values({ file_id: fileId2._id, mode: 8, last_frame: minRawFrame }).execute();
    // Game just under: last_frame = 1776 should be excluded (1776 < 1777)
    await db
      .insertInto("game")
      .values({ file_id: fileId1._id, mode: 8, last_frame: minRawFrame - 1 })
      .execute();
    // Game just over: last_frame = 1778 should be included (1778 >= 1777)
    await db
      .insertInto("game")
      .values({ file_id: fileId3._id, mode: 8, last_frame: minRawFrame + 1 })
      .execute();

    const filter: DurationFilter = {
      type: "duration",
      minFrames: userSearchFrames,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);
    const results = await query.selectAll(["file", "game"]).execute();

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["at_boundary.slp", "just_over.slp"]));
    expect(results.map((r) => r.name)).not.toContain("just_under.slp");
  });

  it("should filter games by maximum duration accounting for offset", async () => {
    // User searches for max 30s (1800 frames)
    // Backend applies: last_frame <= 1800 + DURATION_OFFSET = 1800 - 123 = 1777
    // So raw last_frame must be <= 1777 to be included
    const userSearchFrames = 1800;
    const maxRawFrame = userSearchFrames + DURATION_OFFSET;

    const fileId1 = await db
      .insertInto("file")
      .values({
        name: "just_under.slp",
        folder: "/test",
        size_bytes: 1000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId2 = await db
      .insertInto("file")
      .values({
        name: "at_boundary.slp",
        folder: "/test",
        size_bytes: 2000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId3 = await db
      .insertInto("file")
      .values({
        name: "just_over.slp",
        folder: "/test",
        size_bytes: 3000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Game at boundary: last_frame = 1777 should be included (1777 <= 1777)
    await db.insertInto("game").values({ file_id: fileId2._id, mode: 8, last_frame: maxRawFrame }).execute();
    // Game just under: last_frame = 1776 should be included (1776 <= 1777)
    await db
      .insertInto("game")
      .values({ file_id: fileId1._id, mode: 8, last_frame: maxRawFrame - 1 })
      .execute();
    // Game just over: last_frame = 1778 should be excluded (1778 > 1777)
    await db
      .insertInto("game")
      .values({ file_id: fileId3._id, mode: 8, last_frame: maxRawFrame + 1 })
      .execute();

    const filter: DurationFilter = {
      type: "duration",
      maxFrames: userSearchFrames,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);
    const results = await query.selectAll(["file", "game"]).execute();

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(["just_under.slp", "at_boundary.slp"]));
    expect(results.map((r) => r.name)).not.toContain("just_over.slp");
  });

  it("should filter games by duration range accounting for offset", async () => {
    // User searches for min 10s (600 frames), max 45s (2700 frames)
    // Backend applies:
    //   min: last_frame >= 600 + DURATION_OFFSET = 600 - 123 = 477
    //   max: last_frame <= 2700 + DURATION_OFFSET = 2700 - 123 = 2577
    const userMinFrames = 600;
    const userMaxFrames = 2700;
    const minRawFrame = userMinFrames + DURATION_OFFSET;
    const maxRawFrame = userMaxFrames + DURATION_OFFSET;

    const fileId1 = await db
      .insertInto("file")
      .values({
        name: "below_range.slp",
        folder: "/test",
        size_bytes: 1000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId2 = await db
      .insertInto("file")
      .values({
        name: "at_min_boundary.slp",
        folder: "/test",
        size_bytes: 2000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId3 = await db
      .insertInto("file")
      .values({
        name: "in_range.slp",
        folder: "/test",
        size_bytes: 3000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId4 = await db
      .insertInto("file")
      .values({
        name: "at_max_boundary.slp",
        folder: "/test",
        size_bytes: 4000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();
    const fileId5 = await db
      .insertInto("file")
      .values({
        name: "above_range.slp",
        folder: "/test",
        size_bytes: 5000,
        birth_time: null,
      })
      .returning("_id")
      .executeTakeFirstOrThrow();

    // Below range: last_frame = 476 (< 477) - should be excluded
    await db
      .insertInto("game")
      .values({ file_id: fileId1._id, mode: 8, last_frame: minRawFrame - 1 })
      .execute();
    // At min boundary: last_frame = 477 (>= 477 && <= 2577) - should be included
    await db.insertInto("game").values({ file_id: fileId2._id, mode: 8, last_frame: minRawFrame }).execute();
    // In range: last_frame = 1500 (>= 477 && <= 2577) - should be included
    await db.insertInto("game").values({ file_id: fileId3._id, mode: 8, last_frame: 1500 }).execute();
    // At max boundary: last_frame = 2577 (>= 477 && <= 2577) - should be included
    await db.insertInto("game").values({ file_id: fileId4._id, mode: 8, last_frame: maxRawFrame }).execute();
    // Above range: last_frame = 2578 (> 2577) - should be excluded
    await db
      .insertInto("game")
      .values({ file_id: fileId5._id, mode: 8, last_frame: maxRawFrame + 1 })
      .execute();

    const filter: DurationFilter = {
      type: "duration",
      minFrames: userMinFrames,
      maxFrames: userMaxFrames,
    };

    let query = db.selectFrom("file").innerJoin("game", "game.file_id", "file._id");
    query = applyFilters(query, [filter]);
    const results = await query.selectAll(["file", "game"]).execute();

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining(["at_min_boundary.slp", "in_range.slp", "at_max_boundary.slp"]),
    );
    expect(results.map((r) => r.name)).not.toContain("below_range.slp");
    expect(results.map((r) => r.name)).not.toContain("above_range.slp");
  });

  it("should verify DURATION_OFFSET constant is -123", () => {
    expect(DURATION_OFFSET).toBe(-123);
  });
});
