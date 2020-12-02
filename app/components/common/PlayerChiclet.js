import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';
import * as playerUtils from '../../utils/players';
import SpacedGroup from './SpacedGroup';

import styles from './PlayerChiclet.scss';
import { StockCard } from './stocks'

export default class PlayerChiclet extends Component {
  static propTypes = {
    game: PropTypes.object.isRequired,
    playerIndex: PropTypes.number.isRequired,
    showContainer: PropTypes.bool // eslint-disable-line
  };

  static defaultProps = {
    showContainer: false // eslint-disable-line
  };

  renderNameChiclet() {
    const game = this.props.game;
    const index = this.props.playerIndex;

    const displayName = playerUtils.getPlayerCode(game, index) || playerUtils.getPlayerName(game, index);

    return <div className={styles['name-display']}>{displayName}</div>;
  }

  renderCharacterBadge(player) {
    return (
      <StockCard game={this.props.game} playerIndex={player.playerIndex} />
    );
  }

  renderPortBadge(player) {
    const dotRadius = 2;
    const centerX = 10;
    const centerY = 8;
    const spacer = 2.5;
    const color = '#919296';

    let portCircles = [];
    switch (player.port) {
    case 1:
      portCircles = [
        <circle
          key="1-1"
          cx={centerX}
          cy={centerY}
          r={dotRadius}
          fill={color}
        />,
      ];
      break;
    case 2:
      portCircles = [
        <circle
          key="2-1"
          cx={centerX - spacer}
          cy={centerY}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="2-2"
          cx={centerX + spacer}
          cy={centerY}
          r={dotRadius}
          fill={color}
        />,
      ];
      break;
    case 3:
      portCircles = [
        <circle
          key="3-1"
          cx={centerX}
          cy={centerY - spacer}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="3-2"
          cx={centerX - spacer}
          cy={centerY + spacer}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="3-3"
          cx={centerX + spacer}
          cy={centerY + spacer}
          r={dotRadius}
          fill={color}
        />,
      ];
      break;
    case 4:
      portCircles = [
        <circle
          key="4-1"
          cx={centerX - spacer}
          cy={centerY - spacer}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="4-2"
          cx={centerX + spacer}
          cy={centerY - spacer}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="4-3"
          cx={centerX - spacer}
          cy={centerY + spacer}
          r={dotRadius}
          fill={color}
        />,
        <circle
          key="4-4"
          cx={centerX + spacer}
          cy={centerY + spacer}
          r={dotRadius}
          fill={color}
        />,
      ];
      break;
    default:
      // Nothing
      break;
    }

    return (
      <svg width="20px" height="18px">
        <path
          strokeWidth="2px"
          stroke={color}
          d="M3.18,0.9375
            a9,9 0 1,0 13.5,0
            Z"
          fillOpacity="0"
        />
        {portCircles}
      </svg>
    );
  }

  render() {
    const settings = this.props.game.getSettings() || {};
    const players = settings.players || {};
    const playersByIndex = _.keyBy(players, 'playerIndex');
    const player = playersByIndex[this.props.playerIndex] || {};

    const containerClasses = classNames({
      [styles['container']]: this.props.showContainer,
    });

    return (
      <div className={containerClasses}>
        <SpacedGroup size="xs">
          {this.renderCharacterBadge(player)}
          {this.renderNameChiclet()}
          {this.renderPortBadge(player)}
        </SpacedGroup>
      </div>
    );
  }
}
