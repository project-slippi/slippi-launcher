import type { Database } from "@database/schema";
import type { Kysely } from "kysely";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { FileRepository } from "../repositories/file_repository";
import { GameRepository } from "../repositories/game_repository";
import { aMockFileWith, aMockGameWith } from "./mocks";
import { initTestDb, resetTestDb } from "./test_db";

describe("file_id unique constraint", () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = await initTestDb();
  });

  afterEach(async () => {
    await resetTestDb(db);
  });

  it("should enforce 1:1 relationship between file and game", async () => {
    // Create a file
    const { _id: fileId } = await FileRepository.insertFile(
      db,
      aMockFileWith({ folder: "/replays", name: "test.slp" }),
    );

    // Insert first game - should succeed
    await GameRepository.insertGame(db, aMockGameWith(fileId));

    // Try to insert second game with same file_id - should fail
    const action = async () => await GameRepository.insertGame(db, aMockGameWith(fileId));
    await expect(action()).rejects.toThrow();
  });

  it("should allow different games for different files", async () => {
    // Create two files
    const { _id: fileId1 } = await FileRepository.insertFile(
      db,
      aMockFileWith({ folder: "/replays", name: "test1.slp" }),
    );
    const { _id: fileId2 } = await FileRepository.insertFile(
      db,
      aMockFileWith({ folder: "/replays", name: "test2.slp" }),
    );

    // Insert games for both files - should succeed
    const game1 = await GameRepository.insertGame(db, aMockGameWith(fileId1));
    const game2 = await GameRepository.insertGame(db, aMockGameWith(fileId2));

    // Both games should exist with correct file_ids
    expect(game1).toBeDefined();
    expect(game2).toBeDefined();
    expect(game1.file_id).toBe(fileId1);
    expect(game2.file_id).toBe(fileId2);

    // Verify they have different game IDs
    expect(game1._id).not.toBe(game2._id);
  });
});
