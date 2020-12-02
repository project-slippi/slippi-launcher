import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Table } from 'semantic-ui-react';

import {
  characters,
} from '@slippi/slippi-js';
import classNames from 'classnames';

import styles from './GameProfile.scss';
import { getPlayerCharacterCounts } from '../../utils/game';
import { getStockIconImage } from '../common/stocks'

const columnCount = 5;

export default class PlayerCharacterTable extends Component {
  static propTypes = {
    games: PropTypes.array.isRequired,
    playerTag: PropTypes.string.isRequired,
    opponent: PropTypes.bool.isRequired,
  };

  renderHeaderPlayer() {
    const headerText = `${this.props.opponent ? "Opponent" : "Player"} Characters`
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
        <Table.HeaderCell>Character</Table.HeaderCell>
        <Table.HeaderCell>Games Played</Table.HeaderCell>
        <Table.HeaderCell>Winrate</Table.HeaderCell>
        {this.props.opponent ? <Table.HeaderCell>Unique Players</Table.HeaderCell> : null}
        
      </Table.Row>
    );
  }

  renderRows() {
    let aggs = getPlayerCharacterCounts(this.props.games, this.props.playerTag, this.props.opponent)
    aggs = aggs.slice(0, 9)
    return _.map(aggs, v => this.generateCharacterRow(v[0], v[1]))
  }

  generateCharacterRow(charId, agg) {
    const name = characters.getCharacterShortName(charId)
    const count = agg.count
    const winrate = (agg.won/agg.count*100).toFixed(0)

    const rootDivClasses = classNames({
      [styles['player-col-header']]: true,
      'horizontal-spaced-group-right-xs': true,
    });
    
    return (
      <Table.Row key={`${charId}-${count}`}>
        <Table.Cell>
          <div className={rootDivClasses}>
            <Image
              src={getStockIconImage(charId, 0)}
              height={24}
              width={24}
            />
            <div>{name}</div>
          </div>
        </Table.Cell>
        <Table.Cell>{count}</Table.Cell>
        <Table.Cell>{winrate}%</Table.Cell>
        {this.props.opponent ? <Table.Cell>{agg.players.length}</Table.Cell> : null}
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
