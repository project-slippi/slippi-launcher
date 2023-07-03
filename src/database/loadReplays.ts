import type { FileResult } from "@replays/types";
import type { Kysely } from "kysely";
import _ from "lodash";

import type { Database, ReplayGameStart, ReplayMetadata, ReplayPlayer } from "./types";

export async function loadReplays(database: Kysely<Database>, fullPaths: string[]): Promise<FileResult[]> {
  const replays = await database
    .selectFrom("replay")
    .where("replay.fullPath", "in", fullPaths)
    .innerJoin("replay_game_start", "replay_game_start.replayId", "replay.id")
    .innerJoin("replay_player", "replay_player.settingsId", "replay_game_start.id")
    .innerJoin("replay_metadata", "replay_metadata.replayId", "replay.id")
    .selectAll(["replay", "replay_game_start", "replay_player", "replay_metadata"])
    .orderBy("replay.id", "asc")
    .execute();
  const replayGroups = Object.values(_.groupBy(replays, "id"));
  const replayObjs = replayGroups.map((replay) => {
    const replayObj = replay[0] as any;
    replayObj.winnerIndices = JSON.parse(replay[0].winnerIndices);
    replayObj.settings = replay[0] as ReplayGameStart;
    replayObj.settings.players = replay.map((player) => player as ReplayPlayer);
    replayObj.metadata = replay[0] as ReplayMetadata;
    return replayObj as FileResult;
  });
  return replayObjs as FileResult[];
}
