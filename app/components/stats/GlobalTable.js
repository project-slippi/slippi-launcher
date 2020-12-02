import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'semantic-ui-react';
import classNames from 'classnames';

import styles from './GameProfile.scss';

import * as numberUtils from '../../utils/number';
import { getGlobalStats } from '../../utils/game'

const columnCount = 3;

export default class GlobalTable extends Component {
  static propTypes = {
    games: PropTypes.array.isRequired,
    playerTag: PropTypes.string.isRequired,
  };

  renderStatField(header, value) {
    const classes = classNames({
      [styles['highlight-text']]: false,
    });

    const key = `standard-field-${header}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>{header}</Table.Cell>
        <Table.Cell><div className={classes}>{value}</div></Table.Cell>
      </Table.Row>
    );
  }

  renderMultiStatField(header, values) {
    const classes = classNames({
      [styles['highlight-text']]: false,
    });

    const key = `standard-field-${header}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>{header}</Table.Cell>
        <Table.Cell><div className={classes}>{values.join(' / ')}</div></Table.Cell>
      </Table.Row>
    );
  }

  renderRatioStatField(header, value, total) {
    const classes = classNames({
      [styles['highlight-text']]: false,
    });

    const key = `standard-field-${header}`;

    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>{header}</Table.Cell>
        <Table.Cell>    
          <div className={styles['stat-with-sub-value']}>
            <div className={classes}>{value}</div>
            <div className={styles['secondary-text']}>
              ({numberUtils.formatPercent(value/total)})
            </div>
          </div>
        </Table.Cell>
      </Table.Row>
    );
  }


  renderOverallSection(stats) {
    console.log(stats.opponents)
    return [
      <Table.Row key="overall-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>
          Overall
        </Table.Cell>
      </Table.Row>,
      this.renderStatField('Games Played', stats.count),
      this.renderRatioStatField('Games Won', stats.wins, stats.count),
      this.renderStatField('Opponents Played', stats.opponents.length),
      this.renderStatField('Average Games / Opponent', 
        (stats.count/stats.opponents.length).toFixed(2)),
      this.renderStatField('Total Play Time', 0),
    ];
  }

  renderOffenseSection(stats) {
    return [
      <Table.Row key="offense-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>
          Overall
        </Table.Cell>
      </Table.Row>,
      this.renderStatField('Total Kills', stats.kills),
      this.renderStatField('Total Deaths', stats.deaths),
      this.renderStatField('Total Damage Done', stats.damageDone.toFixed(0)),
      this.renderStatField('Total Damage Received',stats.damageReceived.toFixed(0)),
      this.renderStatField('Average Opening Conversion Rate', 
        numberUtils.formatPercent(stats.conversionRate)),
      this.renderStatField('Average Openings / Kill', stats.openingsPerKill.toFixed(2)),
      this.renderStatField('Average Damage / Opening', stats.damagePerOpening.toFixed(2)),
    ];
  }

  renderNeutralSection(stats) {
    return [
      <Table.Row key="neutral-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>
          Neutral
        </Table.Cell>
      </Table.Row>,
      this.renderStatField('Neutral Winrate', numberUtils.formatPercent(stats.neutralWinRatio)),
    ];
  }

  renderGeneralSection(stats) {
    return [
      <Table.Row key="general-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>
          General
        </Table.Cell>
      </Table.Row>,
      this.renderStatField('Inputs / Minute', stats.inputsPerMinute.toFixed(0)),
      this.renderStatField('Digital Inputs / Minute', stats.digitalInputsPerMinute.toFixed(0)),
    ];
  }

  render() {
    const stats = getGlobalStats(this.props.games, this.props.playerTag)
    return (
      <Table
        className={styles['stats-table']}
        celled={true}
        inverted={true}
        selectable={true}
      >
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan={columnCount}>Global Stats</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {this.renderOverallSection(stats)}
          {this.renderOffenseSection(stats)}
          {this.renderNeutralSection(stats)}
          {this.renderGeneralSection(stats)}
        </Table.Body>
      </Table>
    );
  }
}
