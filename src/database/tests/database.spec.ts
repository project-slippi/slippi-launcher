import { createDatabase } from "database/create_database";
import type { Database, NewGame, NewReplay } from "database/schema";
import type { Kysely } from "kysely";

import * as GameRepository from "../repositories/game_repository";
import * as ReplayRepository from "../repositories/replay_repository";
import * as TestRepository from "./test_repository";

describe("when using the database", () => {
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
    const { _id: replayId } = await ReplayRepository.insertReplay(db, aMockReplayWith());
    expect(await TestRepository.getRowCount(db, "replay")).toEqual(1);

    await GameRepository.insertGame(db, aMockGameWith(replayId));
    expect(await TestRepository.getRowCount(db, "game")).toEqual(1);

    await ReplayRepository.deleteReplaysById(db, [replayId]);
    expect(await TestRepository.getRowCount(db, "replay")).toEqual(0);
    expect(await TestRepository.getRowCount(db, "game")).toEqual(0);
  });
});

function aMockReplayWith(opts: Partial<NewReplay> = {}): NewReplay {
  return {
    folder: "folder",
    file_name: "file_name",
    size_bytes: 123,
    ...opts,
  };
}

function aMockGameWith(replayId: number, opts: Partial<NewGame> = {}): NewGame {
  return {
    replay_id: replayId,
    is_teams: 0,
    stage: 12,
    start_time: null,
    platform: "dolphin",
    console_nickname: "Wii",
    mode: 1,
    last_frame: 123,
    timer_type: 1,
    starting_timer_secs: 480,
    ...opts,
  };
}
