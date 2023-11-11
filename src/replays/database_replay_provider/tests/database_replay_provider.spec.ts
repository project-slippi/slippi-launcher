import { FileRepository } from "@database/repositories/file_repository";
import { GameRepository } from "@database/repositories/game_repository";
import type { Database, NewFile, NewGame } from "@database/schema";
import { initTestDb } from "@database/tests/init_test_db";
import { aMockFileWith, aMockGameWith } from "@database/tests/mocks";
import type { Kysely } from "kysely";

import { DatabaseReplayProvider } from "../database_replay_provider";

describe("database integration tests", () => {
  let db: Kysely<Database>;
  let provider: DatabaseReplayProvider;

  beforeAll(async () => {
    db = await initTestDb();
    provider = new DatabaseReplayProvider(db);
  });

  afterEach(async () => {
    // Clear the database after each test
    await db.deleteFrom("file").execute();
    await db.deleteFrom("game").execute();
    await db.deleteFrom("player").execute();
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

  it("should return paged results in order of game start time", async () => {
    const limit = 2;
    const folder = "folder";
    await addMockGame({ folder, name: "jan.slp" }, { start_time: new Date(2023, 0).toISOString() });
    await addMockGame({ folder, name: "feb.slp" }, { start_time: new Date(2023, 1).toISOString() });
    await addMockGame({ folder, name: "mar.slp" }, { start_time: new Date(2023, 3).toISOString() });
    await addMockGame({ folder, name: "apr.slp" }, { start_time: new Date(2023, 4).toISOString() });
    await addMockGame({ folder, name: "may.slp" }, { start_time: new Date(2023, 5).toISOString() });

    const { files, continuation } = await provider.searchReplays(folder, limit, undefined);
    expect(files.length).toEqual(2);
    expect(continuation).toBeDefined();
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
