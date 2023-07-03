import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface ReplayTable {
  id: Generated<number>;
  name: string;
  fullPath: string;
  size: number;
  startTime: string | null;
  lastFrame: number | null;
  winnerIndices: string;
}

export type Replay = Selectable<ReplayTable>;
export type NewReplay = Insertable<ReplayTable>;
export type ReplayUpdate = Updateable<ReplayTable>;

export interface ReplayGameStartTable {
  id: Generated<number>;
  slpVersion: string | null;
  timerType: number | null;
  inGameMode: number | null;
  friendlyFireEnabled: number | null;
  isTeams: number | null;
  stageId: number | null;
  startingTimerSeconds: number | null;
  itemSpawnBehavior: number | null;
  enabledItems: number | null;
  scene: number | null;
  gameMode: number | null;
  language: number | null;
  randomSeed: number | null;
  isPAL: number | null;
  isFrozenPS: number | null;
  // Foreign key
  replayId: number;
}

export type ReplayGameStart = Selectable<ReplayGameStartTable>;
export type NewReplayGameStart = Insertable<ReplayGameStartTable>;
export type ReplayGameStartUpdate = Updateable<ReplayGameStartTable>;

export interface ReplayMetadataTable {
  id: Generated<number>;
  startAt: string | null;
  playedOn: string | null;
  lastFrame: number | null;
  // Foreign key
  replayId: number;
}

export type ReplayMetadata = Selectable<ReplayMetadataTable>;
export type NewReplayMetadata = Insertable<ReplayMetadataTable>;
export type ReplayMetadataUpdate = Updateable<ReplayMetadataTable>;

export interface ReplayPlayerTable {
  id: Generated<number>;
  playerIndex: number;
  port: number;
  characterId: number | null;
  type: number | null;
  startStocks: number | null;
  characterColor: number | null;
  teamShade: number | null;
  handicap: number | null;
  teamId: number | null;
  staminaMode: number | null;
  silentCharacter: number | null;
  invisible: number | null;
  lowGravity: number | null;
  blackStockIcon: number | null;
  metal: number | null;
  startOnAngelPlatform: number | null;
  rumbleEnabled: number | null;
  cpuLevel: number | null;
  offenseRatio: number | null;
  defenseRatio: number | null;
  modelScale: number | null;
  controllerFix: string | null;
  nametag: string | null;
  displayName: string;
  connectCode: string;
  userId: string;
  // Foreign key
  settingsId: number;
}

export type ReplayPlayer = Selectable<ReplayPlayerTable>;
export type NewReplayPlayer = Insertable<ReplayPlayerTable>;
export type ReplayPlayerUpdate = Updateable<ReplayPlayerTable>;

export interface Database {
  replay: ReplayTable;
  replay_game_start: ReplayGameStartTable;
  replay_metadata: ReplayMetadataTable;
  replay_player: ReplayPlayerTable;
}
