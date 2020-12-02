import _ from 'lodash';

import * as timeUtils from '../utils/time';

import { getPlayerName, getPlayerNamesByIndex } from './players'

export function getPlayerStocks(game, playerIndex) {
  const stocks = _.get(game.getStats(), 'stocks')
  return _.groupBy(stocks, 'playerIndex')[playerIndex] || []
}

export function getLastPlayerStock(game, playerIndex) {
  let playerStocks = getPlayerStocks(game, playerIndex)
  if (playerStocks.length == 0) {
    return {
      playerIndex: playerIndex,
      count: 4,
      endPercent: 0,
    }
  } else {
    return _.orderBy(playerStocks, s => s.count)[0]
  }
}

export function getGameWinner(game) {
  let lastStock0 = getLastPlayerStock(game, 0)
  let lastStock1 = getLastPlayerStock(game, 1)
  if (lastStock0.count > lastStock1.count) return 0
  if (lastStock0.count < lastStock1.count) return 1
  if (lastStock0.endPercent < lastStock1.endPercent) return 0
  if (lastStock0.endPercent > lastStock1.endPercent) return 1
  return -1
}

export function getGamePlayerIndex(game, playerTag) {
  const players = _.values(getPlayerNamesByIndex(game))
  return players[0] === playerTag ? 0 : players[1] === playerTag ? 1 : -1
}

export function getStageName(game) {
  const settings = game.getSettings() || {};
  const stageId = settings.stageId;
  try {
    const stageName = stages.getStageName(stageId);
    return stageName;
  } catch (err) {
    console.log(stageId)
    console.log(err)
    return null;
  }
}

export function getPlayerCharacterCounts(games, playerTag, isOpponent) {
  let aggs = games.map(game => {
    let index = getGamePlayerIndex(game, playerTag)
    if (isOpponent) {
      index = 1 - index
    }
    return {
      charId: _.get(game.getSettings().players, index).characterId,
      won: isOpponent ? index !== getGameWinner(game) : index === getGameWinner(game),
      player: getPlayerName(game, index),
    }
  }).reduce((aggs, x) => {
    aggs[x.charId] = aggs[x.charId] || {count: 0, won: 0, players: []}
    aggs[x.charId].count += 1
    if (x.won) {
      aggs[x.charId].won += 1
    }
    if (!aggs[x.charId].players.includes(x.player)) {
      aggs[x.charId].players.push(x.player)
    }
    return aggs;
  }, {});

  aggs =  _.map(aggs, (value, key) => [key, value])
  aggs =  _.sortBy(aggs, v => -v[1].count)
  return aggs
}

export function getOpponentsSummary(games, playerTag) {
  let aggs = games.map(game => {
    let index = 1 - getGamePlayerIndex(game, playerTag)
    return {
      name: getPlayerName(game, index),
      won: index !== getGameWinner(game),
      charId: _.get(game.getSettings().players, index).characterId,
    }
  }).reduce((agg, x) => {
    agg[x.name] = agg[x.name] || {
      count: 0,
      won: 0,
      charIds: [],
    }
    agg[x.name].count += 1
    if (x.won) {
      agg[x.name].won += 1
    }
    if (!agg[x.name].charIds.includes(x.charId)) {
      agg[x.name].charIds.push(x.charId)
    }
    return agg;
  }, {});

  aggs = _.map(aggs, (value, key) => [key, value])
  aggs = _.sortBy(aggs, v => -v[1].count)
  getTopPunishes(games, playerTag)
  return aggs;
}

export function getTopPunishes(games, playerTag) {
  let aggs = games.map(game => {
    let index = getGamePlayerIndex(game, playerTag)
    let punishes = game.getStats().conversions.filter(p => p.playerIndex === index)
    punishes = _.orderBy(punishes, x => -x.moves.length)
    return punishes[0] || null
  }).filter(x => x !== null)

  return _.orderBy(aggs, x => -x.moves.length)
}

export function getGlobalStats(games, playerTag) {
  const len = games.length
  return games.reduce((a, game) => {
    const agg = a // because es-lint can be dumb
    const index = getGamePlayerIndex(game, playerTag)
    const stats = game.getStats()

    const pOverall = stats.overall[index]
    const oOverall = stats.overall[1-index]


    if (getGameWinner(game) === index) agg.wins += 1
    const opp = getPlayerName(game, 1-index)
    if (!agg.opponents.includes(opp)) agg.opponents.push(opp)
    agg.time += timeUtils.convertFrameCountToDurationString(stats.lastFrame)
    agg.kills += pOverall.killCount
    agg.deaths += oOverall.killCount
    agg.damageDone += pOverall.totalDamage
    agg.damageReceived += oOverall.totalDamage
    agg.conversionRate += pOverall.successfulConversions.ratio / len
    agg.damagePerOpening += pOverall.damagePerOpening.ratio / len
    agg.openingsPerKill += pOverall.openingsPerKill.ratio / len
    agg.neutralWinRatio += pOverall.neutralWinRatio.ratio / len

    agg.inputsPerMinute += pOverall.inputsPerMinute.ratio / len  
    agg.digitalInputsPerMinute += pOverall.digitalInputsPerMinute.ratio / len  
    return agg
  }, {
    count: games.length,
    wins: 0,
    opponents: [],
    time: 0,
    kills: 0,
    deaths: 0,
    damageDone: 0,
    damageReceived: 0,
    conversionRate: 0,
    openingsPerKill: 0,
    damagePerOpening: 0,
    neutralWinRatio: 0,
    inputsPerMinute: 0,
    digitalInputsPerMinute: 0,
  })
}
