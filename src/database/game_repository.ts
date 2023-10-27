import type { Kysely } from "kysely";

import type { Database, NewGame } from "./schema";

type DB = Kysely<Database>;

export async function insertGame(db: DB, ...game: NewGame[]): Promise<void> {
  await db.insertInto("game").values(game).execute();
}

export async function findGamesByFolder(db: DB, folder: string, limit: number) {
  // const replays = await database
  //   .selectFrom("replay")
  //   .where("replay.fullPath", "in", fullPaths)
  //   .innerJoin("replay_game_start", "replay_game_start.replayId", "replay.id")
  //   .innerJoin("replay_player", "replay_player.settingsId", "replay_game_start.id")
  //   .innerJoin("replay_metadata", "replay_metadata.replayId", "replay.id")
  //   .selectAll(["replay", "replay_game_start", "replay_player", "replay_metadata"])
  //   .execute();

  // const replayGroups = Object.values(_.groupBy(replays, "id"));
  // const replayObjs = replayGroups.map((replay) => {
  //   const replayObj = replay[0] as any;
  //   replayObj.winnerIndices = JSON.parse(replay[0].winnerIndices);
  //   replayObj.settings = replay[0] as ReplayGameStart;
  //   replayObj.settings.players = replay.map((player) => player as ReplayPlayer);
  //   replayObj.metadata = replay[0] as ReplayMetadata;
  //   return replayObj as FileResult;
  // });

  const query = db
    .selectFrom("replay")
    .where("folder", "=", folder)
    .limit(limit)
    .innerJoin("game", "game.replay_id", "replay._id");

  const res = await query.selectAll(["replay", "game"]).select(["game._id as _id"]).execute();
  return res;
}
