import type { Database } from "@database/schema";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

import { migrateToLatest } from "../migrate_to_latest";
import { FileRepository } from "../repositories/file_repository";
import { GameRepository } from "../repositories/game_repository";
import { PlayerRepository } from "../repositories/player_repository";
import { aMockFileWith, aMockGameWith, aMockPlayerWith } from "./mocks";

describe("database integration tests", () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = await createDatabase();
  });

  afterEach(async () => {
    // Clear the database after each test
    await db.deleteFrom("file").execute();
    await db.deleteFrom("game").execute();
    await db.deleteFrom("player").execute();
  });

  it("should count total folder size", async () => {
    const folder = "folder";
    await FileRepository.insertFile(db, aMockFileWith({ folder, name: "foo", size_bytes: 10 }));
    expect(await FileRepository.findTotalSizeByFolder(db, folder)).toEqual(10);
    await FileRepository.insertFile(db, aMockFileWith({ folder, name: "bar", size_bytes: 20 }));
    expect(await FileRepository.findTotalSizeByFolder(db, folder)).toEqual(30);
    await FileRepository.insertFile(db, aMockFileWith({ folder, name: "baz", size_bytes: 30 }));
    expect(await FileRepository.findTotalSizeByFolder(db, folder)).toEqual(60);
  });

  it("should disallow files with the same folder and filename", async () => {
    await FileRepository.insertFile(db, aMockFileWith({ folder: "folder", name: "name" }));
    await FileRepository.insertFile(db, aMockFileWith({ folder: "folder", name: "different_name" }));
    await FileRepository.insertFile(db, aMockFileWith({ folder: "different_folder", name: "name" }));

    expect(await getRowCount(db, "file")).toEqual(3);

    const result = FileRepository.insertFile(db, aMockFileWith({ folder: "folder", name: "name" }));
    await expect(result).rejects.toThrowError();
  });

  it("should delete games when files are deleted", async () => {
    const { fileId } = await addMockGame();
    expect(await getRowCount(db, "file")).toEqual(1);
    expect(await getRowCount(db, "game")).toEqual(1);

    await FileRepository.deleteFileById(db, fileId);
    expect(await getRowCount(db, "file")).toEqual(0);
    expect(await getRowCount(db, "game")).toEqual(0);
  });

  it("should delete players when games are deleted", async () => {
    const { gameId } = await addMockGame();
    expect(await getRowCount(db, "game")).toEqual(1);

    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId));
    expect(await getRowCount(db, "player")).toEqual(1);

    await db.deleteFrom("game").where("_id", "=", gameId).execute();
    expect(await getRowCount(db, "game")).toEqual(0);
    expect(await getRowCount(db, "player")).toEqual(0);
  });

  it("should disallow adding the same player for the same game", async () => {
    const { gameId } = await addMockGame();
    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 0 }));
    await PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 1 }));
    expect(await getRowCount(db, "player")).toEqual(2);

    const result = PlayerRepository.insertPlayer(db, aMockPlayerWith(gameId, { index: 1 }));
    await expect(result).rejects.toThrowError();
  });

  const addMockGame = async (): Promise<{ fileId: number; gameId: number }> => {
    const { _id: fileId } = await FileRepository.insertFile(db, aMockFileWith());
    const { _id: gameId } = await GameRepository.insertGame(db, aMockGameWith(fileId));
    return { fileId, gameId };
  };
});

async function createDatabase(): Promise<Kysely<Database>> {
  const sqliteDb = new Sqlite(":memory:");
  const database = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  });

  const migrationsFolder = path.join(__dirname, "../migrations");
  await migrateToLatest(database, migrationsFolder);
  return database;
}

async function getRowCount(db: Kysely<Database>, table: keyof Database): Promise<number> {
  const { num_rows } = await db
    .selectFrom(table)
    .select((eb) => eb.fn.countAll<number>().as("num_rows"))
    .executeTakeFirstOrThrow();
  return num_rows;
}
