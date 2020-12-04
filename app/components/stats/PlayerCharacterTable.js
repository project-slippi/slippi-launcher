import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Table } from 'semantic-ui-react';

import {
  characters,
} from '@slippi/slippi-js';
import classNames from 'classnames';

import styles from './GameProfile.scss';
import { getPlayerCharacterCounts, getGamePlayerIndex } from '../../utils/game';
import { getStockIconImage } from '../common/stocks'

const columnCount = 5;

export default class PlayerCharacterTable extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    opponent: PropTypes.bool.isRequired,
    gamesFilterAdd: PropTypes.func.isRequired,
    gamesFilterRemove: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props)
    this.state ={
      excluded: [],
      filtering: false,
    }
  }

  renderHeaderPlayer() {
    const headerText = `${this.props.opponent ? "Opponent" : "Player"} Characters`
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={columnCount}>
          {headerText} 
          {" " }
          {this.state.filtering ? (<a onClick={() => this.clearFilters()}>Clear Filters</a>) : null} 

        </Table.HeaderCell>
      </Table.Row>
    ); 
  }

  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell >Character</Table.HeaderCell>
        <Table.HeaderCell collapsing={true}>Games</Table.HeaderCell>
        <Table.HeaderCell collapsing={true}>Winrate</Table.HeaderCell>
        {this.props.opponent ? <Table.HeaderCell collapsing={true}>Players</Table.HeaderCell> : null}
        <Table.HeaderCell collapsing={true}>Filters</Table.HeaderCell>
        
      </Table.Row>
    );
  }

  renderRows() {
    const aggs = getPlayerCharacterCounts(this.props.store.games, this.props.store.player, this.props.opponent)
    // aggs = aggs.slice(0, 19)
    return _.map(aggs, v => this.generateCharacterRow(v[0], v[1]))
  }

  clearFilters() {
    this.setState({
      filtering: null,
      excluded: [],
    })
    const filterId = `character${this.props.opponent ? '-opponent' : ''}`
    this.props.gamesFilterRemove({id: filterId})
  }

  setCharacterFilter(charId, hide) {
    const filterId = `character${this.props.opponent ? '-opponent' : ''}`
    const excluded = [...this.state.excluded, charId]
    if (hide) {
      this.setState({ excluded: excluded, filtering: true })
      console.log(this.state.excluded)
      const f = game => {
        let index = getGamePlayerIndex(game, this.props.store.player)
        if (this.props.opponent) index = 1 - index
        const gameId = _.get(game.getSettings().players, index).characterId
        return !excluded.includes(gameId.toString())
      }
      this.props.gamesFilterAdd({id: filterId, value: f})
    } else {
      this.setState({ filtering: true })
      const f = game => {
        let index = getGamePlayerIndex(game, this.props.store.player)
        if (this.props.opponent) index = 1 - index
        const gameId = _.get(game.getSettings().players, index).characterId
        return charId === gameId.toString()
      }
      this.props.gamesFilterAdd({id: filterId, value: f})
    }
  }

  generateFilterToggles(charId) {
    return (
      <div>
        <a onClick={() => this.setCharacterFilter(charId, false)}>focus</a> | <a onClick={() => this.setCharacterFilter(charId, true)}>hide</a>
      </div>
    )
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
        <Table.Cell collapsing={true}>{this.generateFilterToggles(charId)}</Table.Cell>
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
