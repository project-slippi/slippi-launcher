import _ from "lodash";
import { stages, StatsType, GameStartType, MetadataType, StockType, ConversionType } from "@slippi/slippi-js";

export class Game {
  stats!: StatsType;
  settings!: GameStartType;
  metadata!: MetadataType;
  filePath!: string;
  getStats = () => this.stats;
  getSettings = () => this.settings;
  getMetadata = () => this.metadata;
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
  conversionRate: number;
  conversionRateCount: number;
  conversionRateTotal: number;
  openingsPerKill: number;
  openingsPerKillCount: number;
  openingsPerKillTotal: number;
  damagePerOpening: number;
  damagePerOpeningCount: number;
  damagePerOpeningTotal: number;
  neutralWinRatio: number;
  neutralWinRatioCount: number;
  neutralWinRatioTotal: number;
  inputsPerMinute: number;
  inputsPerMinuteCount: number;
  inputsPerMinuteTotal: number;
  digitalInputsPerMinute: number;
  digitalInputsPerMinuteCount: number;
  digitalInputsPerMinuteTotal: number;
  charIds: CharacterStats;
  opponents: OpponentStats;
  opponentChars: CharacterStats;
  punishes: Conversion[];
}

export interface CharacterStats {
  [Key: number]: MatchupAggregate;
}

export interface OpponentStats {
  [Key: string]: MatchupAggregate;
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

export function getGlobalStats(games: Game[], playerTag: string): GlobalStats {
  const aggs = games.reduce(
    (a, game) => {
      const agg = a; // because es-lint can be dumb
      const index = getGamePlayerIndex(game, playerTag);
      const opp = getPlayerName(game, 1 - index);
      const stats = game.getStats();

      const pOverall = stats.overall[index];
      const oOverall = stats.overall[1 - index];

      const won = getGameWinner(game) === index;

      const charId = _.get(game.getSettings().players, index).characterId || -1;
      const oppCharId = _.get(game.getSettings().players, 1 - index).characterId || -1;

      // Opponent aggregates
      agg.opponents[opp] = agg.opponents[opp] || {
        count: 0,
        won: 0,
        charIds: [],
      };
      agg.opponents[opp].count += 1;
      if (won) agg.opponents[opp].won += 1;
      if (!agg.opponents[opp].charIds.includes(oppCharId)) agg.opponents[opp].charIds.push(oppCharId);

      // Player character aggregates
      agg.charIds[charId] = agg.charIds[charId] || {
        count: 0,
        won: 0,
      };
      agg.charIds[charId].count += 1;
      if (won) agg.charIds[charId].won += 1;

      // Opponent character aggregates
      agg.opponentChars[oppCharId] = agg.opponentChars[oppCharId] || {
        count: 0,
        won: 0,
        players: [],
      };
      agg.opponentChars[oppCharId].count += 1;
      if (won) agg.opponentChars[oppCharId].won += 1;
      if (!agg.opponentChars[oppCharId].players.includes(oppCharId)) agg.opponentChars[oppCharId].players.push(opp);

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
      if (won) agg.wins += 1;
      agg.time += stats.lastFrame;

      agg.kills += pOverall.killCount;
      agg.deaths += oOverall.killCount;
      agg.damageDone += pOverall.totalDamage;
      agg.damageReceived += oOverall.totalDamage;

      agg.conversionRateCount += pOverall.successfulConversions.count;
      agg.conversionRateTotal += pOverall.successfulConversions.total;
      agg.damagePerOpeningCount += pOverall.damagePerOpening.count;
      agg.damagePerOpeningTotal += pOverall.damagePerOpening.total;
      agg.openingsPerKillCount += pOverall.openingsPerKill.count;
      agg.openingsPerKillTotal += pOverall.openingsPerKill.total;
      agg.neutralWinRatioCount += pOverall.neutralWinRatio.count;
      agg.neutralWinRatioTotal += pOverall.neutralWinRatio.total;

      agg.inputsPerMinuteCount += pOverall.inputsPerMinute.count;
      agg.inputsPerMinuteTotal += pOverall.inputsPerMinute.total;
      agg.digitalInputsPerMinuteCount += pOverall.digitalInputsPerMinute.count;
      agg.digitalInputsPerMinuteTotal += pOverall.digitalInputsPerMinute.total;

      return agg;
    },
    {
      player: playerTag,
      count: games.length,
      wins: 0,
      time: 0,
      kills: 0,
      deaths: 0,
      damageDone: 0,
      damageReceived: 0,
      conversionRateCount: 0,
      conversionRateTotal: 0,
      openingsPerKillCount: 0,
      openingsPerKillTotal: 0,
      damagePerOpeningCount: 0,
      damagePerOpeningTotal: 0,
      neutralWinRatioCount: 0,
      neutralWinRatioTotal: 0,
      inputsPerMinuteCount: 0,
      inputsPerMinuteTotal: 0,
      digitalInputsPerMinuteCount: 0,
      digitalInputsPerMinuteTotal: 0,
      charIds: {},
      opponents: {},
      opponentChars: {},
      punishes: [] as Conversion[],
    },
  );

  return {
    ...aggs,
    conversionRate: aggs.conversionRateCount / aggs.conversionRateTotal,
    openingsPerKill: aggs.openingsPerKillCount / aggs.openingsPerKillTotal,
    damagePerOpening: aggs.damagePerOpeningCount / aggs.damagePerOpeningTotal,
    neutralWinRatio: aggs.neutralWinRatioCount / aggs.neutralWinRatioTotal,
    inputsPerMinute: aggs.inputsPerMinuteCount / aggs.inputsPerMinuteTotal,
    digitalInputsPerMinute: aggs.digitalInputsPerMinuteCount / aggs.digitalInputsPerMinuteTotal,
  };
}

export function getPlayerCodesByIndex(game: Game) {
  const settings = game.getSettings() || {};
  const metadata = game.getMetadata() || {};

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

  const settings = game.getSettings() || {};
  const metadata = game.getMetadata() || {};

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
  const stocks = game.getStats().stocks;
  return _.groupBy(stocks, "playerIndex")[playerIndex] || [];
}

export function getLastPlayerStock(game: Game, playerIndex: number): StockType {
  const playerStocks = getPlayerStocks(game, playerIndex);
  return _.orderBy(playerStocks, (s) => s.count)[0];
}

export function getGameWinner(game: Game): number {
  const lastStock0 = getLastPlayerStock(game, 0);
  const lastStock1 = getLastPlayerStock(game, 1);
  if (lastStock0.count > lastStock1.count) return 0;
  if (lastStock0.count < lastStock1.count) return 1;
  if (!lastStock0.endPercent) return 0;
  if (!lastStock1.endPercent) return 1;
  if (lastStock0.endPercent < lastStock1.endPercent) return 0;
  if (lastStock0.endPercent > lastStock1.endPercent) return 1;
  return -1;
}

export function getGamePlayerIndex(game: Game, playerTag: string): number {
  const players = _.values(getPlayerNamesByIndex(game));
  if (players[0] === playerTag) return 0;
  if (players[1] === playerTag) return 1;
  return -1;
}

export function getStageName(game: Game): string {
  const stageId = game.getSettings().stageId || -1;
  return stages.getStageName(stageId);
}
