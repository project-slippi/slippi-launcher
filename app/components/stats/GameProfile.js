import React, { Component } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Header,
  Segment,
  Image,
  Icon,
  Button,
  Modal,
  Message,
  Loader,
} from 'semantic-ui-react';
import { stages as stageUtils } from 'slp-parser-js';

import PageHeader from '../common/PageHeader';
import OverallTable from './OverallTable';
import KillsTable from './KillsTable';
import PunishesTable from './PunishesTable';

import styles from './GameProfile.scss';

import getLocalImage from '../../utils/image';
import * as timeUtils from '../../utils/time';
import * as playerUtils from '../../utils/players';
import PageWrapper from '../PageWrapper';
import Scroller from '../common/Scroller';

export default class GameProfile extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,

    // fileLoaderAction
    playFile: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  refStats = null;

  setRefStats = element => {
    this.refStats = element;
  };

  playFile = () => {
    const filePath = _.get(this.props.store, ['game', 'input', 'filePath']);

    // Play the file
    this.props.playFile({
      fullPath: filePath,
    });
  };

  renderContent() {
    const isLoading = _.get(this.props.store, 'isLoading') || false;
    if (isLoading) {
      return this.renderLoading();
    }

    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    if (players.length !== 2) {
      return this.renderEmpty();
    }

    return this.renderStats();
  }

  renderLoading() {
    const store = this.props.store || {};

    return (
      <Loader
        className={styles['loader']}
        inverted={true}
        active={store.isLoading}
        indeterminate={true}
        inline="centered"
        size="big"
      >
        <span>Loading Game...</span>
      </Loader>
    );
  }

  renderEmpty() {
    return (
      <Header
        color="green"
        inverted={true}
        as="h1"
        textAlign="center"
        icon={true}
      >
        <Icon name="hand peace" />
        Only Singles is Supported
      </Header>
    );
  }

  renderGameProfileHeader() {
    const isLoading = _.get(this.props.store, 'isLoading') || false;

    return isLoading
      ? <React.Fragment></React.Fragment>
      : (
        <div className={styles['stats-player-header']}>
          {this.renderMatchupDisplay()}
          {this.renderGameDetails()}
        </div>
      );
  }

  renderMatchupDisplay() {
    return (
      <div className={styles['matchup-display']}>
        {this.renderPlayerDisplay(0)}
        <span className={styles['vs-element']}>vs</span>
        {this.renderPlayerDisplay(1)}
        {this.renderPlayButton()}
      </div>
    );
  }

  renderPlayerDisplay(index) {
    const isFirstPlayer = index === 0;

    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};

    const segmentClasses = classNames({
      [styles['player-display']]: true,
      [styles['second']]: !isFirstPlayer,
      'horizontal-spaced-group-right-sm': isFirstPlayer,
      'horizontal-spaced-group-left-sm': !isFirstPlayer,
    });

    const game = this.props.store.game;
    const playerNamesByIndex = playerUtils.getPlayerNamesByIndex(game);

    return (
      <Segment className={segmentClasses} textAlign="center" basic={true}>
        <Header inverted={true} textAlign="center" as="h2">
          {playerNamesByIndex[player.playerIndex]}
        </Header>
        <Image
          className={styles['character-image']}
          src={getLocalImage(
            `stock-icon-${player.characterId}-${player.characterColor}.png`
          )}
        />
      </Segment>
    );
  }

  renderGameDetails() {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const stageName =
      stageUtils.getStageName(gameSettings.stageId) || 'Unknown';

    const duration =
      _.get(this.props.store, ['game', 'stats', 'lastFrame']) || 0;
    const durationDisplay = timeUtils.convertFrameCountToDurationString(
      duration
    );

    const platform =
      _.get(this.props.store, ['game', 'metadata', 'playedOn']) || 'Unknown';

    const startAt = _.get(this.props.store, ['game', 'metadata', 'startAt']);
    const startAtDisplay = timeUtils.convertToDateAndTime(startAt);

    const gameDetailsClasses = classNames({
      [styles['game-details']]: true,
    });

    const metadata = [
      {
        label: 'Stage',
        content: stageName,
      },
      {
        label: 'Duration',
        content: durationDisplay,
      },
      {
        label: 'Time',
        content: startAtDisplay,
      },
      {
        label: 'Platform',
        content: platform,
      },
    ];

    const consoleNick = _.get(this.props.store, [
      'game',
      'metadata',
      'consoleNick',
    ]);
    if (consoleNick) {
      metadata.push({
        label: 'Console Name',
        content: consoleNick,
      });
    }

    const metadataElements = metadata.map(details => (
      <div key={details.label}>
        <span className={styles['label']}>{details.label}</span>
        &nbsp;
        <span className={styles['content']}>{details.content}</span>
      </div>
    ));

    return (
      <Segment className={gameDetailsClasses} basic={true}>
        {metadataElements}
      </Segment>
    );
  }

  renderPlayButton() {
    return (
      <Button
        className={styles['play-button']}
        content="Launch Replay"
        circular={true}
        color="grey"
        basic={true}
        inverted={true}
        size="tiny"
        icon="play"
        onClick={this.playFile}
      />
    );
  }

  renderStats() {
    const scrollerOffset = this.props.topNotifOffset + 120; // + 120 to account for game-specific header

    return (
      <Scroller topOffset={scrollerOffset}>
        <Segment basic={true}>
          {this.renderErrorModal()}
          <div ref={this.setRefStats}>
            {this.renderOverall()}
            {this.renderStocks()}
            {this.renderPunishes()}
          </div>
        </Segment>
      </Scroller>
    );
  }

  renderErrorModal() {
    const errors = this.props.errors || {};
    const errorKey = 'fileLoader-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';

    return (
      <Modal
        open={showGlobalError}
        basic={true}
        closeIcon={true}
        onClose={_.partial(this.props.dismissError, errorKey)}
      >
        <Modal.Header>Error Launching Replay</Modal.Header>
        <Modal.Content>
          <Message
            error={true}
            icon="warning circle"
            content={globalErrorMessage}
          />
        </Modal.Content>
      </Modal>
    );
  }

  renderPlayerColHeader(isFirstPlayer = true) {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};

    const rootDivClasses = classNames({
      [styles['player-col-header']]: true,
      'horizontal-spaced-group-right-xs': true,
    });

    return (
      <div className={rootDivClasses}>
        <Image
          src={getLocalImage(
            `stock-icon-${player.characterId}-${player.characterColor}.png`
          )}
          height={24}
          width={24}
        />
        <div>Player {player.port}</div>
      </div>
    );
  }

  renderOverall() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Overall
        </Header>
        <OverallTable
          game={this.props.store.game}
          player1Display={this.renderPlayerColHeader(true)}
          player1Index={this.getPlayerIndex(true)}
          player2Display={this.renderPlayerColHeader(false)}
          player2Index={this.getPlayerIndex(false)}
        />
      </Segment>
    );
  }

  renderStocks() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Kills
        </Header>
        <div className={styles['two-column-main']}>
          <KillsTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(true)}
            playerIndex={this.getPlayerIndex(true)}
          />
          <KillsTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(false)}
            playerIndex={this.getPlayerIndex(false)}
          />
        </div>
      </Segment>
    );
  }

  renderPunishes() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Openings & Conversions
        </Header>
        <div className={styles['two-column-main']}>
          <PunishesTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(true)}
            playerIndex={this.getPlayerIndex(true)}
          />
          <PunishesTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(false)}
            playerIndex={this.getPlayerIndex(false)}
          />
        </div>
      </Segment>
    );
  }

  getPlayerIndex(isFirstPlayer = true) {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};
    return player.playerIndex;
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader icon="game" text="Game" history={this.props.history} />
          {this.renderGameProfileHeader()}
          {this.renderContent()}
        </div>
      </PageWrapper>
    );
  }
}
