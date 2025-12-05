import { FileRepository } from "@database/repositories/file_repository";
import { GameRepository } from "@database/repositories/game_repository";
import type { Database, NewFile, NewGame } from "@database/schema";
import { initTestDb } from "@database/tests/init_test_db";
import { aMockFileWith, aMockGameWith } from "@database/tests/mocks";
import type { Kysely } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DatabaseReplayProvider } from "../database_replay_provider";

describe("replay pagination integration tests", () => {
  let db: Kysely<Database>;
  let provider: DatabaseReplayProvider;

  beforeEach(async () => {
    db = await initTestDb();
    provider = new DatabaseReplayProvider(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should return no continuation when all results are fetched", async () => {
    const folder = "folder";
    await addMockGame({ folder, name: "jan.slp" }, { start_time: new Date(2023, 0).toISOString() });
    await addMockGame({ folder, name: "feb.slp" }, { start_time: new Date(2023, 1).toISOString() });
    await addMockGame({ folder, name: "mar.slp" }, { start_time: new Date(2023, 3).toISOString() });
    await addMockGame({ folder, name: "apr.slp" }, { start_time: new Date(2023, 4).toISOString() });
    await addMockGame({ folder, name: "may.slp" }, { start_time: new Date(2023, 5).toISOString() });

    const res = await provider.searchReplays(folder, 5, undefined);
    expect(res.files.length).toEqual(5);
    expect(res.continuation).toBeUndefined();

    const res2 = await provider.searchReplays(folder, 6, undefined);
    expect(res2.files.length).toEqual(5);
    expect(res2.continuation).toBeUndefined();
  });

  describe("when sorting games by startTime", () => {
    it("should return paged results in reverse chronological order", async () => {
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "jan.slp" }, { start_time: new Date(2023, 0).toISOString() });
      await addMockGame({ folder, name: "feb.slp" }, { start_time: new Date(2023, 1).toISOString() });
      await addMockGame({ folder, name: "mar.slp" }, { start_time: new Date(2023, 3).toISOString() });
      await addMockGame({ folder, name: "apr.slp" }, { start_time: new Date(2023, 4).toISOString() });
      await addMockGame({ folder, name: "may.slp" }, { start_time: new Date(2023, 5).toISOString() });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("may.slp");
      expect(res1.files[1].fileName).toEqual("apr.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("mar.slp");
      expect(res2.files[1].fileName).toEqual("feb.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("jan.slp");
    });

    it("should return null start times at the end", async () => {
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "jan.slp" }, { start_time: new Date(2023, 0).toISOString() });
      await addMockGame({ folder, name: "null_1.slp" }, { start_time: null });
      await addMockGame({ folder, name: "mar.slp" }, { start_time: new Date(2023, 3).toISOString() });
      await addMockGame({ folder, name: "null_2.slp" }, { start_time: null });
      await addMockGame({ folder, name: "may.slp" }, { start_time: new Date(2023, 5).toISOString() });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("may.slp");
      expect(res1.files[1].fileName).toEqual("mar.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("jan.slp");
      expect(res2.files[1].fileName).toEqual("null_2.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("null_1.slp");
    });

    it("should support sorting by reverse-chronological order", async () => {
      const orderBy = { field: "startTime", direction: "asc" } as const;
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "jan.slp" }, { start_time: new Date(2023, 0).toISOString() });
      await addMockGame({ folder, name: "null_1.slp" }, { start_time: null });
      await addMockGame({ folder, name: "mar.slp" }, { start_time: new Date(2023, 3).toISOString() });
      await addMockGame({ folder, name: "null_2.slp" }, { start_time: null });
      await addMockGame({ folder, name: "may.slp" }, { start_time: new Date(2023, 5).toISOString() });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined, orderBy);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("null_1.slp");
      expect(res1.files[1].fileName).toEqual("null_2.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation, orderBy);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("jan.slp");
      expect(res2.files[1].fileName).toEqual("mar.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation, orderBy);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("may.slp");
    });
  });

  describe("when sorting games by lastFrame", () => {
    it("should return paged results for the longest games first", async () => {
      const orderBy = { field: "lastFrame" } as const;
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "1.slp" }, { last_frame: 100 });
      await addMockGame({ folder, name: "2.slp" }, { last_frame: 200 });
      await addMockGame({ folder, name: "3.slp" }, { last_frame: 200 });
      await addMockGame({ folder, name: "4.slp" }, { last_frame: 400 });
      await addMockGame({ folder, name: "5.slp" }, { last_frame: 500 });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined, orderBy);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("5.slp");
      expect(res1.files[1].fileName).toEqual("4.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation, orderBy);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("3.slp");
      expect(res2.files[1].fileName).toEqual("2.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation, orderBy);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("1.slp");
    });

    it("should return null last_frame games at the end", async () => {
      const orderBy = { field: "lastFrame" } as const;
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "1.slp" }, { last_frame: 100 });
      await addMockGame({ folder, name: "null_1.slp" }, { last_frame: null });
      await addMockGame({ folder, name: "3.slp" }, { last_frame: 300 });
      await addMockGame({ folder, name: "null_2.slp" }, { last_frame: null });
      await addMockGame({ folder, name: "5.slp" }, { last_frame: 300 });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined, orderBy);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("5.slp");
      expect(res1.files[1].fileName).toEqual("3.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation, orderBy);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("1.slp");
      expect(res2.files[1].fileName).toEqual("null_2.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation, orderBy);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("null_1.slp");
    });

    it("should support sorting by shortest game first", async () => {
      const orderBy = { field: "lastFrame", direction: "asc" } as const;
      const limit = 2;
      const folder = "folder";
      await addMockGame({ folder, name: "1.slp" }, { last_frame: 100 });
      await addMockGame({ folder, name: "null_1.slp" }, { last_frame: null });
      await addMockGame({ folder, name: "3.slp" }, { last_frame: 300 });
      await addMockGame({ folder, name: "null_2.slp" }, { last_frame: null });
      await addMockGame({ folder, name: "5.slp" }, { last_frame: 300 });

      // Get the first 2
      const res1 = await provider.searchReplays(folder, limit, undefined, orderBy);
      expect(res1.files.length).toEqual(2);
      expect(res1.continuation).toBeDefined();
      expect(res1.files[0].fileName).toEqual("null_1.slp");
      expect(res1.files[1].fileName).toEqual("null_2.slp");

      // Get the next 2
      const res2 = await provider.searchReplays(folder, limit, res1.continuation, orderBy);
      expect(res2.files.length).toEqual(2);
      expect(res2.continuation).toBeDefined();
      expect(res2.files[0].fileName).toEqual("1.slp");
      expect(res2.files[1].fileName).toEqual("3.slp");

      // Get the last 1
      const res3 = await provider.searchReplays(folder, limit, res2.continuation, orderBy);
      expect(res3.files.length).toEqual(1);
      expect(res3.continuation).toBeUndefined();
      expect(res3.files[0].fileName).toEqual("5.slp");
    });
  });

  const addMockGame = async (
    fileOpts?: Partial<NewFile>,
    gameOpts?: Partial<NewGame>,
  ): Promise<{ fileId: number; gameId: number }> => {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith(fileOpts));
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId, gameOpts));
    return { fileId, gameId };
  };
});
