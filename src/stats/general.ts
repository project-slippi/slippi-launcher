import type { ActionCountsType, ConversionType } from "@slippi/slippi-js";

import type { Game, GameFilters, Ratio, StatsComputer } from "./stats";
import { completeRatio, getGamePlayerCodeIndex, getGameWinner, getPlayerName, reduceStats } from "./stats";

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

export interface GlobalStats {
  player: string;
  count: number;
  wins: number;
  time: number;
  kills: number;
  deaths: number;
  damageDone: number;
  damageReceived: number;
  conversionRate: Ratio;
  openingsPerKill: Ratio;
  damagePerOpening: Ratio;
  neutralWinrate: Ratio;
  counterhitWinrate: Ratio;
  tradeWinrate: Ratio;
  inputsPerMinute: Ratio;
  digitalInputsPerMinute: Ratio;
  characters: CharacterStats;
  opponents: OpponentStats;
  opponentChars: CharacterStats;
  stages: StageStats;
  punishes: Conversion[];
  actions: ActionCountsType & { total: number };
}

export function getGlobalStatsComputer(playerCode: string, filters: GameFilters): StatsComputer<GlobalStats> {
  return {
    playerCode,
    filters,
    initialState: initialState(playerCode),
    reducer: processGameGeneral,
    postProcessor: postProcessGeneral,
  };
}

export function getGlobalStats(games: Game[], playerCode: string, filters: GameFilters): GlobalStats {
  return reduceStats(games, getGlobalStatsComputer(playerCode, filters));
}

export const initialState = (playerCode: string) => ({
  player: playerCode,
  count: 0,
  wins: 0,
  time: 0,
  kills: 0,
  deaths: 0,
  damageDone: 0,
  damageReceived: 0,
  conversionRate: { count: 0, total: 0, ratio: 0 },
  openingsPerKill: { count: 0, total: 0, ratio: 0 },
  damagePerOpening: { count: 0, total: 0, ratio: 0 },
  neutralWinrate: { count: 0, total: 0, ratio: 0 },
  counterhitWinrate: { count: 0, total: 0, ratio: 0 },
  tradeWinrate: { count: 0, total: 0, ratio: 0 },
  inputsPerMinute: { count: 0, total: 0, ratio: 0 },
  digitalInputsPerMinute: { count: 0, total: 0, ratio: 0 },
  characters: {},
  opponents: {},
  opponentChars: {},
  stages: {},
  punishes: [] as Conversion[],
  actions: actionInitialState(),
});

const actionInitialState = () => ({
  playerIndex: 0,
  total: 0,
  wavedashCount: 0,
  wavelandCount: 0,
  airDodgeCount: 0,
  dashDanceCount: 0,
  spotDodgeCount: 0,
  ledgegrabCount: 0,
  rollCount: 0,
  lCancelCount: {
    success: 0,
    fail: 0,
  },
  attackCount: {
    jab1: 0,
    jab2: 0,
    jab3: 0,
    jabm: 0,
    dash: 0,
    ftilt: 0,
    utilt: 0,
    dtilt: 0,
    fsmash: 0,
    usmash: 0,
    dsmash: 0,
    nair: 0,
    fair: 0,
    bair: 0,
    uair: 0,
    dair: 0,
  },
  grabCount: {
    success: 0,
    fail: 0,
  },
  throwCount: {
    up: 0,
    forward: 0,
    back: 0,
    down: 0,
  },
  groundTechCount: {
    away: 0,
    in: 0,
    neutral: 0,
    fail: 0,
  },
  wallTechCount: {
    success: 0,
    fail: 0,
  },
});

const mergeActions = (agg: GlobalStats, actions: ActionCountsType) => {
  agg.actions.wavedashCount += actions.wavedashCount;
  agg.actions.wavelandCount += actions.wavelandCount;
  agg.actions.airDodgeCount += actions.airDodgeCount;
  agg.actions.dashDanceCount += actions.dashDanceCount;
  agg.actions.spotDodgeCount += actions.spotDodgeCount;
  agg.actions.ledgegrabCount += actions.ledgegrabCount;
  agg.actions.rollCount += actions.rollCount;
  agg.actions.lCancelCount.success += actions.lCancelCount.success;
  agg.actions.lCancelCount.fail += actions.lCancelCount.fail;
  agg.actions.attackCount.jab1 += actions.attackCount.jab1;
  agg.actions.attackCount.jab2 += actions.attackCount.jab2;
  agg.actions.attackCount.jab3 += actions.attackCount.jab3;
  agg.actions.attackCount.jabm += actions.attackCount.jabm;
  agg.actions.attackCount.dash += actions.attackCount.dash;
  agg.actions.attackCount.ftilt += actions.attackCount.ftilt;
  agg.actions.attackCount.utilt += actions.attackCount.utilt;
  agg.actions.attackCount.dtilt += actions.attackCount.dtilt;
  agg.actions.attackCount.fsmash += actions.attackCount.fsmash;
  agg.actions.attackCount.usmash += actions.attackCount.usmash;
  agg.actions.attackCount.dsmash += actions.attackCount.dsmash;
  agg.actions.attackCount.nair += actions.attackCount.nair;
  agg.actions.attackCount.fair += actions.attackCount.fair;
  agg.actions.attackCount.bair += actions.attackCount.bair;
  agg.actions.attackCount.uair += actions.attackCount.uair;
  agg.actions.attackCount.dair += actions.attackCount.dair;
  agg.actions.grabCount.success += actions.grabCount.success;
  agg.actions.grabCount.fail += actions.grabCount.fail;
  agg.actions.throwCount.up += actions.throwCount.up;
  agg.actions.throwCount.forward += actions.throwCount.forward;
  agg.actions.throwCount.back += actions.throwCount.back;
  agg.actions.throwCount.down += actions.throwCount.down;
  agg.actions.groundTechCount.away += actions.groundTechCount.away;
  agg.actions.groundTechCount.in += actions.groundTechCount.in;
  agg.actions.groundTechCount.neutral += actions.groundTechCount.neutral;
  agg.actions.groundTechCount.fail += actions.groundTechCount.fail;
  agg.actions.wallTechCount.success += actions.wallTechCount.success;
  agg.actions.wallTechCount.fail += actions.wallTechCount.fail;
};

export const processGameGeneral = (agg: GlobalStats, game: Game, playerCode: string) => {
  const index = getGamePlayerCodeIndex(game, playerCode);
  const opp = getPlayerName(game, 1 - index);
  const stats = game.stats;

  if (!stats || stats.overall === undefined || index < 0) {
    return agg;
  }
  const playerOverall = stats.overall[index];
  const opponentOverall = stats.overall[1 - index];
  const won = getGameWinner(game) === index;

  const players = game.settings.players;
  if (players.length !== 2) {
    return agg;
  }

  agg.count += 1;

  const charId = players[index].characterId!;
  const oppCharId = players[1 - index].characterId!;

  // Opponent aggregates
  agg.opponents[opp] = agg.opponents[opp] || {
    count: 0,
    won: 0,
    charIds: [],
  };
  agg.opponents[opp].count += 1;
  agg.opponents[opp].won += won ? 1 : 0;
  if (!agg.opponents[opp].charIds.includes(oppCharId)) {
    agg.opponents[opp].charIds.push(oppCharId);
  }

  const characterAggregates = (agg: CharacterStats, player: string, charId: number, won: boolean) => {
    agg[charId] = agg[charId] || {
      count: 0,
      won: 0,
      unique: [],
    };
    agg[charId].count += 1;
    agg[charId].won += won ? 1 : 0;
    if (!agg[charId].unique.includes(player)) {
      agg[charId].unique.push(player);
    }
  };

  characterAggregates(agg.characters, playerCode, charId, won);
  characterAggregates(agg.opponentChars, opp, oppCharId, won);

  const stage = game.settings.stageId;
  if (stage !== null) {
    agg.stages[stage] = agg.stages[stage] || {
      count: 0,
      won: 0,
    };
    agg.stages[stage].count += 1;
    agg.stages[stage].won += won ? 1 : 0;
  }

  // const diff = (p: ConversionType) => p.currentPercent - p.startPercent;

  // Punishes
  // TODO: Implement as efficient top N structure
  agg.punishes = [
    ...agg.punishes,
    ...stats.conversions
      .filter((p) => p.playerIndex === index)
      .map((p) => ({
        punish: p,
        game: game,
      })),
  ]
    // .sort((a, b) => diff(b.punish) - diff(a.punish))
    .slice(0, 50);

  // General stats
  agg.wins += won ? 1 : 0;
  agg.time += stats.lastFrame;

  agg.kills += playerOverall.killCount;
  agg.deaths += opponentOverall.killCount;
  agg.damageDone += playerOverall.totalDamage;
  agg.damageReceived += opponentOverall.totalDamage;

  agg.conversionRate.count += playerOverall.successfulConversions.count;
  agg.conversionRate.total += playerOverall.successfulConversions.total;
  agg.damagePerOpening.count += playerOverall.damagePerOpening.count;
  agg.damagePerOpening.total += playerOverall.damagePerOpening.total;
  agg.openingsPerKill.count += playerOverall.openingsPerKill.count;
  agg.openingsPerKill.total += playerOverall.openingsPerKill.total;
  agg.neutralWinrate.count += playerOverall.neutralWinRatio.count;
  agg.neutralWinrate.total += playerOverall.neutralWinRatio.total;
  agg.counterhitWinrate.count += playerOverall.counterHitRatio.count;
  agg.counterhitWinrate.total += playerOverall.counterHitRatio.total;
  agg.tradeWinrate.count += playerOverall.beneficialTradeRatio.count;
  agg.tradeWinrate.total += playerOverall.beneficialTradeRatio.total;

  agg.inputsPerMinute.count += playerOverall.inputsPerMinute.count;
  agg.inputsPerMinute.total += playerOverall.inputsPerMinute.total;
  agg.digitalInputsPerMinute.count += playerOverall.digitalInputsPerMinute.count;
  agg.digitalInputsPerMinute.total += playerOverall.digitalInputsPerMinute.total;
  const playerActions = stats.actionCounts.find((a) => a.playerIndex === index);
  if (playerActions) {
    mergeActions(agg, playerActions);
  }

  return agg;
};

export const postProcessGeneral = (agg: GlobalStats) => {
  if (!agg) {
    return agg;
  }

  // agg.punishes = agg.punishes.sort((a, b) => diff(b.punish) - diff(a.punish)).slice(0, 50);
  // agg.punishes = agg.punishes.slice(0, 50);

  completeRatio(agg.conversionRate);
  completeRatio(agg.openingsPerKill);
  completeRatio(agg.damagePerOpening);
  completeRatio(agg.neutralWinrate);
  completeRatio(agg.counterhitWinrate);
  completeRatio(agg.tradeWinrate);
  completeRatio(agg.inputsPerMinute);
  completeRatio(agg.digitalInputsPerMinute);

  return agg;
};
