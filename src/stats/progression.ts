import type { ConversionType } from "@slippi/slippi-js";

import { initialState } from "./general";
import type { Game, GameFilters, GlobalStats, StatsComputer } from "./stats";
import { postProcessGeneral, processGameGeneral, reduceStats } from "./stats";

export interface CharacterStats {
  [Key: number]: MatchupAggregate;
}

export interface OpponentStats {
  [Key: string]: MatchupAggregate;
}

export interface StageStats {
  [Key: string]: StageAggregate;
}

export interface StageAggregate {
  count: number;
  won: number;
}

export interface MatchupAggregate {
  count: number;
  won: number;
  unique: string[];
  charIds: number[];
}

export interface Conversion {
  punish: ConversionType;
  game: Game;
}

export interface ProgressionStat extends GlobalStats {
  day: Date;
}

export interface DailyStats {
  single: ProgressionStat[];
  cummulative: ProgressionStat[];
}

export function getProgressionStatsComputer(playerCode: string, filters: GameFilters): StatsComputer<DailyStats> {
  return {
    playerCode,
    filters,
    initialState: { single: [], cummulative: [] },
    reducer: processGameProgression,
    postProcessor: postProcessProgression,
  };
}

export function getProgressionStats(games: Game[], playerCode: string, filters: GameFilters): DailyStats {
  return reduceStats(games, getProgressionStatsComputer(playerCode, filters));
}

const getGameDay = (game: Game) => {
  if (!game.metadata?.startAt) {
    return undefined;
  }
  const time = new Date(game.metadata.startAt);
  return new Date(time.getFullYear(), time.getMonth());
};

const processGameProgression = (agg: DailyStats, game: Game, playerCode: string) => {
  const day = getGameDay(game);
  if (!day) {
    return agg;
  }
  if (agg.single.length == 0) {
    agg.single.push({ ...initialState(playerCode), day });
  }

  let lastDay = new Date(agg.single[agg.single.length - 1].day);
  lastDay = new Date(lastDay.getFullYear(), lastDay.getMonth());

  if (lastDay.getTime() != day.getTime()) {
    agg.single.push({
      ...initialState(playerCode),
      day,
    });
  }
  processGameGeneral(agg.single[agg.single.length - 1], game, playerCode);
  return agg;
};

const postProcessProgression = (agg: DailyStats) => {
  agg.single.forEach((a) => postProcessGeneral(a));
  return agg;
};
