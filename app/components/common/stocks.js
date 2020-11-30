import _ from 'lodash';
import classNames from 'classnames';
import React  from 'react';
import PropTypes from 'prop-types';
import { Image } from 'semantic-ui-react';

import styles from '../stats/GameProfile.scss';
import getLocalImage from '../../utils/image';

const StockCard = ({game, playerIndex}) => {
  const gameSettings = game.getSettings();
  const players = gameSettings.players || [];
  const playersByIndex = _.keyBy(players, 'playerIndex');
  const player = playersByIndex[playerIndex];

  const stocks = _.get(game.getStats(), 'stocks')
  let playerStocks = _.groupBy(stocks, 'playerIndex')[playerIndex] || []
  playerStocks= playerStocks.filter(s => s.endFrame !== null)
  const count = playerStocks.length > 0 ? playerStocks[playerStocks.length - 1].count : 4
  const totalStocks = player.startStocks;
  const currentStocks = count - 1;

  const stockIcons = _.range(1, totalStocks + 1).map(stockNum => {
    const imgClasses = classNames({
      [styles['lost-stock']]: stockNum > currentStocks,
    });

    return (
      <Image
        key={`stock-image-${playerIndex}-${stockNum}`}
        className={imgClasses}
        src={getLocalImage(
          `stock-icon-${player.characterId}-${player.characterColor}.png`
        )}
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

export default StockCard
