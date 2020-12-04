import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Table } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import classNames from 'classnames';

import styles from './GameProfile.scss';
import { getOpponentsSummary, getGamePlayerIndex } from '../../utils/game';
import { getPlayerName } from '../../utils/players'
import { getStockIconImage } from '../common/stocks'

const columnCount = 5;

export default class OpponentTable extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    setPlayerProfilePage: PropTypes.func.isRequired,
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
    const headerText = 'Top Opponents'
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={columnCount}>
          {headerText}
          {" "}
          {this.state.filtering ? (<a onClick={() => this.clearFilters()}>Clear Filters</a>) : null}
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  clearFilters() {
    this.setState({
      filtering: null,
      excluded: [],
    })
    this.props.gamesFilterRemove({id: "opponent"})
  }


  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell>Player</Table.HeaderCell>
        <Table.HeaderCell collapsing={true}>Games</Table.HeaderCell>
        <Table.HeaderCell collapsing={true}>Winrate</Table.HeaderCell>
        <Table.HeaderCell>Characters</Table.HeaderCell>
        <Table.HeaderCell>Filters</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderRows() {
    let aggs = getOpponentsSummary(this.props.store.games, this.props.store.player)
    aggs = aggs.slice(0, 26)
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
        <Table.Cell><Link to="/player" onClick={() => this.props.setPlayerProfilePage(playerTag)}>{playerTag}</Link></Table.Cell>
        <Table.Cell>{agg.count}</Table.Cell>
        <Table.Cell>{(agg.won/agg.count*100).toFixed(0)}%</Table.Cell>
        <Table.Cell>
          <div className={rootDivClasses}>
            {chars.slice(0,5)}
          </div>
        </Table.Cell>
        <Table.Cell collapsing={true}>{this.generateFilterToggles(playerTag)}</Table.Cell>
      </Table.Row>
    );
  };

  generateFilterToggles(charId) {
    return (
      <div>
        <a onClick={() => this.setCharacterFilter(charId, false)}>focus</a> | <a onClick={() => this.setCharacterFilter(charId, true)}>hide</a>
      </div>
    )
  }

  setCharacterFilter(charId, hide) {
    const filterId = 'opponent'
    const excluded = [...this.state.excluded, charId]
    if (hide) {
      this.setState({ excluded: excluded, filtering: true })
      const f = game => {
        const index = 1 - getGamePlayerIndex(game, this.props.store.player)
        const playerTag = getPlayerName(game, index)
        return !excluded.includes(playerTag)
      }
      this.props.gamesFilterAdd({id: filterId, value: f})
    } else {
      this.setState({ filtering: true })
      const f = game => {
        const index = 1 - getGamePlayerIndex(game, this.props.store.player)
        const playerTag = getPlayerName(game, index)
        return charId === playerTag
      }
      this.props.gamesFilterAdd({id: filterId, value: f})
    }
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
          {this.renderHeaderPlayer()}
          {this.renderHeaderColumns()}
        </Table.Header>

        <Table.Body>{this.renderRows()}</Table.Body>
      </Table>
    );
  }

}
