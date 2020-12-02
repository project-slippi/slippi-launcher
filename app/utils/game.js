import _ from 'lodash';

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

