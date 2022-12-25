import type { GameStartType, MetadataType, StatsType, StockType } from "@slippi/slippi-js";
import { stages } from "@slippi/slippi-js";
import _ from "lodash";

import type { GlobalStats } from "./general";
import type { ProgressionStat } from "./progression";

export * from "./general";

export interface Game {
  stats: StatsType | null;
  settings: GameStartType;
  metadata: MetadataType | null;
  fullPath: string;
}

export interface Ratio {
  ratio: number;
  count: number;
  total: number;
}

export type GameFilter = (g: Game, p: string) => boolean;

export type GameFilters = {
  characters: number[];
  opponentCharacters: number[];
  opponents: string[];
  stages: string[];
};

export type MultiStats = {
  global: GlobalStats;
  timeseries: ProgressionStat[];
};

// Global Reducer

export type StatsReducer<T> = (agg: T, game: Game, playerCode: string) => T;
export type StatsPostProcessor<T> = (agg: T) => T;

export interface StatsComputer<T> {
  filters: GameFilters;
  playerCode: string;
  initialState: T;
  reducer: StatsReducer<T>;
  postProcessor: StatsPostProcessor<T>;
}

export function reduceStats<T>(gs: Game[], computer: StatsComputer<T>): T {
  const games = gs.filter(
    (g) =>
      opponentFilter(g, computer.playerCode, computer.filters.opponents) &&
      characterFilter(g, computer.playerCode, false, computer.filters.characters) &&
      characterFilter(g, computer.playerCode, true, computer.filters.opponentCharacters) &&
      stageFilter(g, computer.filters.stages),
  );
  games.reverse();
  const agg = games.reduce((agg, game) => {
    try {
      return computer.reducer(agg, game, computer.playerCode);
    } catch (err) {
      console.log(err);
      return agg;
    }
  }, computer.initialState);

  return computer.postProcessor(agg);
}

// Filters

export const opponentFilter = (game: Game, p: string, filtered: string[]) => {
  const index = 1 - getGamePlayerCodeIndex(game, p);
  const playerTag = getPlayerName(game, index);
  return !filtered.includes(playerTag);
};

export const characterFilter = (game: Game, p: string, opponent: boolean, filtered: number[]) => {
  let index = getGamePlayerCodeIndex(game, p);
  index = opponent ? 1 - index : index;
  const players = game.settings.players;
  if (!players || players.length !== 2 || index < 0) {
    return false;
  }
  const charId = players[index].characterId!;
  return !filtered.includes(charId);
};

export const stageFilter = (game: Game, filtered: string[]) => {
  const stage = getStageName(game);
  return !filtered.includes(stage);
};

// Utils

export function getPlayerCodesByIndex(game: Game) {
  const settings = game.settings || {};
  const metadata = game.metadata || {};

  const players = settings.players || [];

  return _.chain(players)
    .keyBy("playerIndex")
    .mapValues((player) => {
      // Netplay code
      const names = _.get(metadata, ["players", player.playerIndex, "names"]) || {};
      const netplayCode = names.code;

      // If there is none, there is none.
      // No fallback since we're always displaying the player name next to it.
      return netplayCode || null;
    })
    .value();
}

export function getPlayerNamesByIndex(game: Game) {
  if (!game) {
    return {};
  }

  const settings = game.settings || {};
  const metadata = game.metadata || {};

  const players = settings.players || [];
  return _.chain(players)
    .keyBy("playerIndex")
    .mapValues((player) => {
      // Netplay name
      const names = _.get(metadata, ["players", player.playerIndex, "names"]) || {};
      const netplayName = names.netplay;

      // In-game Nametag
      const nametag = player.nametag;

      // Backup names
      const playerTypeStr = player.type === 1 ? "CPU" : "Player";
      const portName = `${playerTypeStr} ${player.port}`;

      return netplayName || nametag || portName;
    })
    .value();
}

export function getPlayerName(game: Game, playerIndex: number) {
  const playerNames = getPlayerNamesByIndex(game);
  return playerNames[playerIndex];
}

export function getPlayerCode(game: Game, playerIndex: number) {
  const playerCodes = getPlayerCodesByIndex(game);
  return playerCodes[playerIndex];
}

export function getPlayerStocks(game: Game, playerIndex: number): StockType[] {
  const stocks = game.stats!.stocks;
  return _.groupBy(stocks, "playerIndex")[playerIndex] || [];
}

export function getLastPlayerStock(game: Game, playerIndex: number): StockType {
  const playerStocks = getPlayerStocks(game, playerIndex);
  return _.orderBy(playerStocks, (s) => s.count)[0] || { count: 0, deathAnimation: 0 };
}

export function getGameWinner(game: Game): number {
  const lastStock0 = getLastPlayerStock(game, 0);
  const lastStock1 = getLastPlayerStock(game, 1);

  return lastStock0.count > lastStock1.count
    ? 0
    : lastStock0.count < lastStock1.count
    ? 1
    : lastStock0.endPercent == null
    ? 0
    : lastStock1.endPercent == null
    ? 1
    : lastStock0.endPercent < lastStock1.endPercent
    ? 0
    : lastStock0.endPercent > lastStock1.endPercent
    ? 1
    : -1;
}

export function getGamePlayerIndex(game: Game, playerTag: string): number {
  const players = _.values(getPlayerNamesByIndex(game));
  if (players[0] === playerTag) {
    return 0;
  }
  if (players[1] === playerTag) {
    return 1;
  }
  return -1;
}

export function getGamePlayerCodeIndex(game: Game, code: string): number {
  const players = _.values(getPlayerCodesByIndex(game));
  if (players[0] === code) {
    return 0;
  }
  if (players[1] === code) {
    return 1;
  }
  return -1;
}

export function getStageName(game: Game): string {
  const stageId = game.settings.stageId;
  if (stageId == null) {
    return "error";
  }
  return stages.getStageName(stageId);
}

export const completeRatio = (ratio: Ratio) => (ratio.ratio = ratio.count / ratio.total);

export const compareDate = (d1: Date, d2: Date) => (d1 == d2 ? 0 : d1 < d2 ? 1 : -1);
