import _ from 'lodash';

export function getPlayerCodesByIndex(game) {
  if (!game) {
    return null;
  }

  const settings = game.getSettings() || {};
  const metadata = game.getMetadata() || {};

  const players = settings.players || [];

  return _.chain(players).keyBy('playerIndex').mapValues(player => {
    // Netplay code
    const names = _.get(metadata, ['players', player.playerIndex, 'names']) || {};
    const netplayCode = names.code;

    // If there is none, there is none.
    // No fallback since we're always displaying the player name next to it.
    return netplayCode || null;
  }).value();
}

export function getPlayerNamesByIndex(game) {
  if (!game) {
    return {};
  }

  const settings = game.getSettings() || {};
  const metadata = game.getMetadata() || {};

  const players = settings.players || [];
  return _.chain(players).keyBy('playerIndex').mapValues(player => {
    // Netplay name
    const names = _.get(metadata, ['players', player.playerIndex, 'names']) || {};
    const netplayName = names.netplay;

    // In-game Nametag
    const nametag = player.nametag;

    // Backup names
    const playerTypeStr = player.type === 1 ? "CPU" : "Player";
    const portName = `${playerTypeStr} ${player.port}`;

    return netplayName || nametag || portName;
  }).value();
}

export function getPlayerName(game, playerIndex) {
  const playerNames = getPlayerNamesByIndex(game);
  return playerNames[playerIndex];
}

export function getPlayerCode(game, playerIndex) {
  const playerCodes = getPlayerCodesByIndex(game);
  return playerCodes[playerIndex];
}
