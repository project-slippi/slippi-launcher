/* eslint-disable no-nested-ternary */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Button,
  Header,
  Segment,
  Icon,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import PageHeader from './common/PageHeader';
import PageWrapper from './PageWrapper';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Broadcast.scss';
import Scroller from './common/Scroller';
import SpacedGroup from './common/SpacedGroup';

export default class Broadcast extends Component {
  static propTypes = {
    // error actions
    dismissError: PropTypes.func.isRequired,
    // broadcast actions
    startBroadcast: PropTypes.func.isRequired,
    stopBroadcast: PropTypes.func.isRequired,
    refreshBroadcasts: PropTypes.func.isRequired,
    watchChannel: PropTypes.func.isRequired,
    initSpectate: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    broadcast: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  componentDidMount() {
    this.props.initSpectate();
  }

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'broadcast-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';
    return (
      <DismissibleMessage
        className="bottom-spacer"
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={[errorKey]}
      />
    );
  }

  renderButton() {
    const { isConnecting, isBroadcasting } = this.props.broadcast;
    const active = isConnecting || isBroadcasting;
    const buttonText = active ? "Stop Broadcast" : "Start Broadcast";
    const onClick = () => {
      if (active) {
        this.props.stopBroadcast();
      } else {
        this.props.startBroadcast();
      }
    };
    return (
      <Button
        color="blue"
        size="large"
        onClick={onClick}
      >
        {buttonText}
      </Button>
    );
  }

  renderRefreshButton() {
    return (
      <Button
        color="blue"
        size="large"
        onClick={() => this.props.refreshBroadcasts()}
      >
        Refresh
      </Button>
    );
  }

  renderChannels() {
    const channels = _.get(this.props.broadcast, 'channels') || [];
    const broadcastEntries = _.map(channels, channel => {
      const name = _.get(channel, ['broadcaster', 'name']);
      return (
        <SpacedGroup key={channel.id} direction="horizontal">
          <div>{name} ({channel.id})</div>
          <Button
            color="blue"
            size="small"
            onClick={() => this.props.watchChannel(channel.id)}
          >
            Watch
          </Button>
        </SpacedGroup>
      );
    });

    return (
      <div>
        {broadcastEntries}
      </div>
    );
  }

  renderNotLoggedIn() {
    return (
      <div className={styles['empty-loader-content']}>
        <Header
          as="h2"
          icon={true}
          color="grey"
          inverted={true}
          textAlign="center"
        >
          <Icon name="question circle outline" />
          <Header.Content>
            Not logged in
            <Header.Subheader>
              You must be logged in to broadcast your gameplay. Go to the settings page to log in.
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Segment basic={true} textAlign="center">
          <Link to="/settings">
            <Button color="blue" size="large">
              Open settings
            </Button>
          </Link>
        </Segment>
      </div>
    );
  }

  renderContent() {
    const { user } = this.props.auth;
    if (!user) {
      return this.renderNotLoggedIn();
    }

    const { slippiConnectionStatus, dolphinConnectionStatus, startTime, endTime, isConnecting, isBroadcasting } = this.props.broadcast;
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderButton()}
        <div>Status: {isBroadcasting ? `broadcasting since ${JSON.stringify(startTime)}` : endTime ? `broadcast lasted ${(endTime - startTime) / 1000} seconds` : "not broadcasting"}</div>
        <div>dolphin connection status: {JSON.stringify(dolphinConnectionStatus)}</div>
        <div>slippi connection status: {JSON.stringify(slippiConnectionStatus)}</div>
        <div>isBroadcasting: {JSON.stringify(isBroadcasting)}</div>
        <div>isConnecting: {JSON.stringify(isConnecting)}</div>
        <h2>Spectate</h2>
        {this.renderRefreshButton()}
        {this.renderChannels()}
      </div>
    );
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader
            icon="podcast"
            text="Broadcast"
            history={this.props.history}
          />
          <Scroller topOffset={this.props.topNotifOffset}>
            {this.renderContent()}
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}

/* eslint-enable no-nested-ternary */