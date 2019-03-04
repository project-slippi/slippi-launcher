import _ from 'lodash';

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
