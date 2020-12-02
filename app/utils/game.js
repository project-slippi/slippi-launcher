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

