import _ from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Table, Icon, Image } from 'semantic-ui-react';

import styles from './GameProfile.scss';

import * as playerUtils from '../../utils/players';
import * as timeUtils from '../../utils/time';
import { getTopPunishes, getGamePlayerIndex } from '../../utils/game'
import { getStockIconImage } from '../common/stocks'

const columnCount = 8;

export default class ComboTable extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
  };

  generatePunishRow(game, punish) {
    const start = timeUtils.convertFrameCountToDurationString(punish.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;
    const damage = this.renderDamageCell(punish);
    const damageRange = this.renderDamageRangeCell(punish);
    const openingType = this.renderOpeningTypeCell(punish);

    if (punish.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(punish.endFrame);
    }

    const secondaryTextStyle = styles['secondary-text'];

    return (
      <Table.Row key={`${punish.playerIndex}-punish-${punish.startFrame}`}>
        <Table.Cell collapsing={true}>{this.getPlayerCard(game, false)}</Table.Cell>
        <Table.Cell collapsing={true}>{this.getPlayerCard(game, true)}</Table.Cell>
        <Table.Cell collapsing={true}>{openingType}</Table.Cell>
        <Table.Cell collapsing={true}>{damage}</Table.Cell>
        <Table.Cell className={styles['attach-to-left-cell']}>
          {damageRange}
        </Table.Cell>
        <Table.Cell>{punish.moves.length}</Table.Cell>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>
          {start}
        </Table.Cell>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>
          {end}
        </Table.Cell>
      </Table.Row>
    );
  };

  getPlayerCard(game, isOpponent) {
    let index = getGamePlayerIndex(game, this.props.store.player)
    if (isOpponent) index = 1 - index
    const tag = playerUtils.getPlayerName(game, index)
    const players = game.getSettings().players || [];
    const playersByIndex = _.keyBy(players, 'playerIndex');
    const player = playersByIndex[index];
    const rootDivClasses = classNames({
      [styles['player-col-header']]: true,
      'horizontal-spaced-group-right-xs': true,
    });
    
    return (
      <div className={rootDivClasses}>
        <Image
          src={getStockIconImage(player.characterId, player.characterColor)}
          height={24}
          width={24}
        />
        <div>{tag}</div>
      </div>

    )
  }

  renderDamageCell(punish) {
    const difference = punish.currentPercent - punish.startPercent;

    let heartColor = 'green';
    if (difference >= 70) {
      heartColor = 'red';
    } else if (difference >= 35) {
      heartColor = 'yellow';
    }

    const diffDisplay = `${Math.trunc(difference)}%`;

    return (
      <div
        className={`${
          styles['punish-damage-display']
        } horizontal-spaced-group-right-sm`}
      >
        <Icon
          inverted={true}
          color={heartColor}
          name="heartbeat"
          size="large"
        />
        <div>{diffDisplay}</div>
      </div>
    );
  }

  renderDamageRangeCell(punish) {
    return (
      <div className={styles['secondary-text']}>
        {`(${Math.trunc(punish.startPercent)}% - ${Math.trunc(
          punish.currentPercent
        )}%)`}
      </div>
    );
  }

  renderOpeningTypeCell(punish) {
    const textTranslation = {
      'counter-attack': 'Counter Hit',
      'neutral-win': 'Neutral',
      trade: 'Trade',
    };

    return (
      <div className={styles['secondary-text']}>
        {textTranslation[punish.openingType]}
      </div>
    );
  }

  renderHeaderTitle() {
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={columnCount}>
          Top Punishes
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell>Player</Table.HeaderCell>
        <Table.HeaderCell>Opponent</Table.HeaderCell>
        <Table.HeaderCell>Opening</Table.HeaderCell>
        <Table.HeaderCell colSpan={2}>Damage</Table.HeaderCell>
        <Table.HeaderCell>Moves</Table.HeaderCell>
        <Table.HeaderCell>Start</Table.HeaderCell>
        <Table.HeaderCell>End</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderPunishRows() {
    let punishes = getTopPunishes(this.props.store.games, this.props.store.player) 
    punishes = punishes.slice(0, 19)
    const elements = [];
    punishes.forEach(punish => {
      const punishRow = this.generatePunishRow(punish.game, punish.punish);
      elements.push(punishRow);
    });
    return elements;
  }

  render() {
    return (
      <Table
        className={styles['stats-table']}
        celled={true}
        inverted={true}
        selectable={true}
      >
        <Table.Header>
          {this.renderHeaderTitle()}
          {this.renderHeaderColumns()}
        </Table.Header>

        <Table.Body>{this.renderPunishRows()}</Table.Body>
      </Table>
    );
  }

}
