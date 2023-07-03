import type { FileResult } from "@replays/types";
import type { Kysely } from "kysely";
import _ from "lodash";

import type {
  Database,
  NewReplay,
  NewReplayGameStart,
  NewReplayMetadata,
  NewReplayPlayer,
  ReplayGameStart,
} from "./types";

export default async function (database: Kysely<Database>, replays: FileResult[]) {
  if (replays.length == 0) {
    return;
  }

  // Preserve replay properties for later insert
  const replaysCopy = _.cloneDeep(replays);
  const metadataObjs = replaysCopy.map((replay) => replay.metadata);
  const playerObjs = replaysCopy.map((replay) => replay.settings.players);
  const settingsObjs = replaysCopy.map((replay) => replay.settings);

  // Insert replay files
  const resReplays: NewReplay[] = replaysCopy.map((replay) => {
    const replayObj = replay as any;
    delete replayObj["settings"];
    delete replayObj["metadata"];
    replayObj.winnerIndices = JSON.stringify(replay.winnerIndices);
    return replayObj as NewReplay;
  });
  const replayInsert = await database.insertInto("replay").values(resReplays).executeTakeFirstOrThrow();
  if (replayInsert.insertId === undefined) {
    throw "db error";
  }
  const replayId = Number(replayInsert.insertId);

  // Insert GameStart data for replays
  const resSettings: NewReplayGameStart[] = settingsObjs.map((settings, index) => {
    const settingsObj = settings as any;
    delete settingsObj["players"];
    delete settingsObj["gameInfoBlock"];
    delete settingsObj["matchInfo"];
    settingsObj.isFrozenPS = Number(settings.isFrozenPS);
    settingsObj.isPAL = Number(settings.isPAL);
    settingsObj.isTeams = Number(settings.isTeams);
    settingsObj.friendlyFireEnabled = Number(settings.friendlyFireEnabled);
    settingsObj.replayId = replayId - replays.length + index + 1;
    return settingsObj as ReplayGameStart as NewReplayGameStart;
  });
  const settingsInsert = await database.insertInto("replay_game_start").values(resSettings).executeTakeFirst();
  if (settingsInsert.insertId === undefined) {
    throw "db error";
  }
  const settingsId = Number(settingsInsert.insertId);

  // Insert Player data for replays
  const resPlayers: NewReplayPlayer[] = playerObjs
    .map((players, index) => {
      const playersObj = players.map((player) => {
        const playerObj = player as any;
        playerObj.settingsId = settingsId - replays.length + index + 1;
        playerObj.staminaMode = Number(player.staminaMode);
        playerObj.silentCharacter = Number(player.silentCharacter);
        playerObj.lowGravity = Number(player.lowGravity);
        playerObj.invisible = Number(player.invisible);
        playerObj.blackStockIcon = Number(player.blackStockIcon);
        playerObj.metal = Number(player.metal);
        playerObj.startOnAngelPlatform = Number(player.startOnAngelPlatform);
        playerObj.rumbleEnabled = Number(player.rumbleEnabled);
        return player as NewReplayPlayer;
      });
      return playersObj as NewReplayPlayer[];
    })
    .flat();
  await database.insertInto("replay_player").values(resPlayers).executeTakeFirstOrThrow();

  // Insert Metadata for replays
  const resMetadata: NewReplayMetadata[] = metadataObjs.map((metadata, index) => {
    const metadataObj = metadata as any;
    metadataObj.replayId = replayId - replays.length + index + 1;
    delete metadataObj["players"];
    return metadataObj as NewReplayMetadata;
  });
  await database.insertInto("replay_metadata").values(resMetadata).executeTakeFirst();
}
