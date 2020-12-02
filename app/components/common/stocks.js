import _ from 'lodash';
import classNames from 'classnames';
import React  from 'react';
import PropTypes from 'prop-types';
import { Image } from 'semantic-ui-react';

import styles from '../stats/GameProfile.scss';
import getLocalImage from '../../utils/image';
import { getLastPlayerStock } from '../../utils/game';


/*
 * These icons are used everywhere so it makes sense to keep them cached 
 * instead of keep reloading the file. The FileLoader table particularly 
 * suffers quite a bit when scrolling as FileRows get loaded dynamically
 */
const icons = {}
export const getStockIconImage = (charId, color) => {
  if (!icons[charId]) icons[charId] = []
  if (!icons[charId][color]) icons[charId][color] = getLocalImage(`stock-icon-${charId}-${color}.png`)
  return icons[charId][color]
}

export const StockCard = ({game, playerIndex}) => {
  const gameSettings = game.getSettings();
  const players = gameSettings.players || [];
  const playersByIndex = _.keyBy(players, 'playerIndex');
  const player = playersByIndex[playerIndex];

  const lastStock = getLastPlayerStock(game, playerIndex)
  const count = lastStock.endPercent == null ? lastStock.count : lastStock.count - 1

  const stockIcons = _.range(1, player.startStocks + 1).map(stockNum => {
    const imgClasses = classNames({
      [styles['lost-stock']]: stockNum > count,
    });

    return (
      <Image
        key={`stock-image-${playerIndex}-${stockNum}`}
        className={imgClasses}
        src={getStockIconImage(player.characterId, player.characterColor)}
        height={20}
        width={20}
      />
    );
  });

  const containerClasses = classNames({
    [styles['stock-display']]: true,
    'horizontal-spaced-group-right-xs': true,
  });

  return (
    <div className={containerClasses}>{stockIcons}</div>
  );
} 

StockCard.propTypes = {
  game: PropTypes.object.isRequired,
  playerIndex: PropTypes.number.isRequired,
};
