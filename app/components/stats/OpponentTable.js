import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Table } from 'semantic-ui-react';

import classNames from 'classnames';

import styles from './GameProfile.scss';
import { getOpponentsSummary } from '../../utils/game';
import { getStockIconImage } from '../common/stocks'

const columnCount = 5;

export default class OpponentTable extends Component {
  static propTypes = {
    games: PropTypes.array.isRequired,
    playerTag: PropTypes.string.isRequired,
  };

  renderHeaderPlayer() {
    const headerText = 'Top Opponents'
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={columnCount}>
          {headerText}
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell>Player</Table.HeaderCell>
        <Table.HeaderCell>Games Played</Table.HeaderCell>
        <Table.HeaderCell>Winrate</Table.HeaderCell>
        <Table.HeaderCell>Characters</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderRows() {
    let aggs = getOpponentsSummary(this.props.games, this.props.playerTag)
    aggs = aggs.slice(0, 9)
    return _.map(aggs, v => this.generateOpponentRow(v[0], v[1]))
  }

  generateOpponentRow(playerTag, agg) {
    const rootDivClasses = classNames({
      [styles['player-col-header']]: true,
      'horizontal-spaced-group-right-xs': true,
    });

    const chars = agg.charIds.map(charId => (
      <Image
        key={charId}
        src={getStockIconImage(charId, 0)}
        height={24}
        width={24}
      />
    ))

    return (
      <Table.Row key={`${playerTag}-${agg.count}`}>
        <Table.Cell>{playerTag}</Table.Cell>
        <Table.Cell>{agg.count}</Table.Cell>
        <Table.Cell>{(agg.won/agg.count*100).toFixed(0)}%</Table.Cell>
        <Table.Cell>
          <div className={rootDivClasses}>
            {chars}
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  render() {
    return (
      <Table
        className={styles['stats-table']}
        celled={true}
        inverted={true}
        selectable={true}
      >
        <Table.Header>
          {this.renderHeaderPlayer()}
          {this.renderHeaderColumns()}
        </Table.Header>

        <Table.Body>{this.renderRows()}</Table.Body>
      </Table>
    );
  }

}
