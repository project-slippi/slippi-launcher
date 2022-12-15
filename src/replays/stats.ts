import type { ConversionType, GameStartType, MetadataType, StatsType, StockType } from "@slippi/slippi-js";
import { stages } from "@slippi/slippi-js";
import _ from "lodash";

// import { FullMetadataType } from "./replayBrowser";

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
}

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

export type GameFilter = (g: Game, p: string) => boolean;

export type GameFilters = {
  characters: number[];
  opponentCharacters: number[];
  opponents: string[];
};
const opponentFilter = (game: Game, p: string, filtered: string[]) => {
  const index = 1 - getGamePlayerCodeIndex(game, p);
  const playerTag = getPlayerName(game, index);
  return !filtered.includes(playerTag);
};

const characterFilter = (game: Game, p: string, opponent: boolean, filtered: number[]) => {
  let index = getGamePlayerCodeIndex(game, p);
  index = opponent ? 1 - index : index;
  const players = game.settings.players;
  if (players.length !== 2 || index < 0) {
    return false;
  }
  const charId = players[index].characterId!;
  return !filtered.includes(charId);
};

export function getGlobalStats(gs: Game[], playerCode: string, filters: GameFilters): GlobalStats {
  const games = gs.filter(
    (g) =>
      opponentFilter(g, playerCode, filters.opponents) &&
      characterFilter(g, playerCode, false, filters.characters) &&
      characterFilter(g, playerCode, true, filters.opponentCharacters),
  );
  const aggs = games.reduce(
    (a, game) => {
      const agg = a; // because es-lint can be dumb
      try {
        const index = getGamePlayerCodeIndex(game, playerCode);
        const opp = getPlayerName(game, 1 - index);
        const stats = game.stats;
        if (!stats) {
          return agg;
        }
        if (stats.overall == undefined) {
          return agg;
        }

        const pOverall = stats.overall[index];
        const oOverall = stats.overall[1 - index];

        const won = getGameWinner(game) === index;

        const players = game.settings.players;
        if (players.length !== 2) {
          return agg;
        }
        const charId = players[index].characterId!;
        const oppCharId = players[1 - index].characterId!;

        // Opponent aggregates
        agg.opponents[opp] = agg.opponents[opp] || {
          count: 0,
          won: 0,
          charIds: [],
        };
        agg.opponents[opp].count += 1;
        if (won) {
          agg.opponents[opp].won += 1;
        }
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
          if (won) {
            agg[charId].won += 1;
          }
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

        // Punishes
        agg.punishes = [
          ...agg.punishes,
          ...stats.conversions
            .filter((p) => p.playerIndex === index)
            .map((p) => ({
              punish: p,
              game: game,
            })),
        ];

        // General stats
        if (won) {
          agg.wins += 1;
        }
        agg.time += stats.lastFrame;

        agg.kills += pOverall.killCount;
        agg.deaths += oOverall.killCount;
        agg.damageDone += pOverall.totalDamage;
        agg.damageReceived += oOverall.totalDamage;
        stats.overall;

        agg.conversionRate.count += pOverall.successfulConversions.count;
        agg.conversionRate.total += pOverall.successfulConversions.total;
        agg.damagePerOpening.count += pOverall.damagePerOpening.count;
        agg.damagePerOpening.total += pOverall.damagePerOpening.total;
        agg.openingsPerKill.count += pOverall.openingsPerKill.count;
        agg.openingsPerKill.total += pOverall.openingsPerKill.total;
        agg.neutralWinrate.count += pOverall.neutralWinRatio.count;
        agg.neutralWinrate.total += pOverall.neutralWinRatio.total;
        agg.counterhitWinrate.count += pOverall.counterHitRatio.count;
        agg.counterhitWinrate.total += pOverall.counterHitRatio.total;
        agg.tradeWinrate.count += pOverall.beneficialTradeRatio.count;
        agg.tradeWinrate.total += pOverall.beneficialTradeRatio.total;

        agg.inputsPerMinute.count += pOverall.inputsPerMinute.count;
        agg.inputsPerMinute.total += pOverall.inputsPerMinute.total;
        agg.digitalInputsPerMinute.count += pOverall.digitalInputsPerMinute.count;
        agg.digitalInputsPerMinute.total += pOverall.digitalInputsPerMinute.total;

        return agg;
      } catch (err) {
        console.log(err);
        return agg;
      }
    },
    {
      player: playerCode,
      count: games.length,
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
    },
  );

  const diff = (p: ConversionType) => p.currentPercent - p.startPercent;
  aggs.punishes = aggs.punishes.sort((a, b) => diff(b.punish) - diff(a.punish)).slice(0, 50);

  aggs.conversionRate.ratio = aggs.conversionRate.count / aggs.conversionRate.total;
  aggs.openingsPerKill.ratio = aggs.openingsPerKill.count / aggs.openingsPerKill.total;
  aggs.damagePerOpening.ratio = aggs.damagePerOpening.count / aggs.damagePerOpening.total;
  aggs.neutralWinrate.ratio = aggs.neutralWinrate.count / aggs.neutralWinrate.total;
  aggs.counterhitWinrate.ratio = aggs.neutralWinrate.count / aggs.neutralWinrate.total;
  aggs.tradeWinrate.ratio = aggs.neutralWinrate.count / aggs.neutralWinrate.total;
  aggs.inputsPerMinute.ratio = aggs.inputsPerMinute.count / aggs.inputsPerMinute.total;
  aggs.digitalInputsPerMinute.ratio = aggs.digitalInputsPerMinute.count / aggs.digitalInputsPerMinute.total;
  return aggs;
}

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
  const stocks = game.metadata!.stocks;
  return _.groupBy(stocks, "playerIndex")[playerIndex] || [];
}

export function getLastPlayerStock(game: Game, playerIndex: number): StockType {
  const playerStocks = getPlayerStocks(game, playerIndex);
  return _.orderBy(playerStocks, (s) => s.count)[0] || { count: 0, deathAnimation: 0 };
}

export function getGameWinner(game: Game): number {
  const lastStock0 = getLastPlayerStock(game, 0);
  const lastStock1 = getLastPlayerStock(game, 1);
  if (lastStock0.count > lastStock1.count) {
    return 0;
  }
  if (lastStock0.count < lastStock1.count) {
    return 1;
  }
  if (lastStock0.endPercent == null) {
    return 0;
  }
  if (lastStock1.endPercent == null) {
    return 1;
  }
  if (lastStock0.endPercent < lastStock1.endPercent) {
    return 0;
  }
  if (lastStock0.endPercent > lastStock1.endPercent) {
    return 1;
  }
  return -1;
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
