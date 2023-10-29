import SQLite from "better-sqlite3";
import type { Database } from "database/schema";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";
import * as GameRepository from "../repositories/game_repository";
import * as PlayerRepository from "../repositories/player_repository";
import * as ReplayRepository from "../repositories/replay_repository";
import { aMockGameWith, aMockPlayerWith, aMockReplayWith } from "./mocks";
import * as TestRepository from "./test_repository";

describe("database integration tests", () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = await createDatabase();
  });

  afterEach(async () => {
    // Clear the database after each test
    await TestRepository.clearDatabase(db);
  });

  it("should disallow replays with the same folder and filename", async () => {
    await ReplayRepository.insertReplay(db, aMockReplayWith({ folder: "folder", file_name: "name" }));
    await ReplayRepository.insertReplay(db, aMockReplayWith({ folder: "folder", file_name: "different_name" }));
    await ReplayRepository.insertReplay(db, aMockReplayWith({ folder: "different_folder", file_name: "name" }));

    const numReplays = await TestRepository.getRowCount(db, "replay");
    expect(numReplays).toEqual(3);

    const result = ReplayRepository.insertReplay(db, aMockReplayWith({ folder: "folder", file_name: "name" }));
    await expect(result).rejects.toThrowError();
  });

  it("should delete games when replays are deleted", async () => {
    const { replayId } = await addMockGame();
    expect(await TestRepository.getRowCount(db, "replay")).toEqual(1);
    expect(await TestRepository.getRowCount(db, "game")).toEqual(1);

    await ReplayRepository.deleteReplayById(db, replayId);
    expect(await TestRepository.getRowCount(db, "replay")).toEqual(0);
    expect(await TestRepository.getRowCount(db, "game")).toEqual(0);
  });

  it("should delete players when games are deleted", async () => {
    const { gameId } = await addMockGame();
    expect(await TestRepository.getRowCount(db, "game")).toEqual(1);

    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId));
    expect(await TestRepository.getRowCount(db, "player")).toEqual(1);

    await TestRepository.deleteGameById(db, gameId);
    expect(await TestRepository.getRowCount(db, "game")).toEqual(0);
    expect(await TestRepository.getRowCount(db, "player")).toEqual(0);
  });

  it("should disallow adding the same player for the same game", async () => {
    const { gameId } = await addMockGame();
    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 0 }));
    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 1 }));
    expect(await TestRepository.getRowCount(db, "player")).toEqual(2);

    const result = PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 1 }));
    await expect(result).rejects.toThrowError();
  });

  const addMockGame = async (): Promise<{ replayId: number; gameId: number }> => {
    const { _id: replayId } = await ReplayRepository.insertReplay(db, aMockReplayWith());
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(replayId));
    return { replayId, gameId };
  };
});

async function createDatabase(): Promise<Kysely<Database>> {
  const sqliteDb = new SQLite(":memory:");
  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  const migrationsFolder = path.join(__dirname, "../migrations");
  await migrateToLatest(database, migrationsFolder);
  return database;
}
