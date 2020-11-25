/* eslint-disable no-nested-ternary */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as firebase from 'firebase';
import classNames from 'classnames';

import {
  Button, Header, Segment, Icon, Tab, Input, List,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { ConnectionStatus } from '@slippi/slippi-js';

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
    watchBroadcast: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    broadcast: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  state = {
    viewerId: "",
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
        this.props.startBroadcast(this.state.viewerId);
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

  renderBroadcasts() {
    const broadcasts = _.get(this.props.broadcast, 'broadcasts') || [];
    if (_.isEmpty(broadcasts)) {
      return (
        <Header
          as="h3"
          color="grey"
          inverted={true}
        >
          <Icon name="question circle outline" />
          <Header.Content>
            No broadcasts found
            <Header.Subheader>
              Click refresh to reload
            </Header.Subheader>
          </Header.Content>
        </Header>
      )
    }
    const broadcastEntries = _.map(broadcasts, broadcast => {
      const name = _.get(broadcast, 'name');
      const broadcasterName = _.get(broadcast, ['broadcaster', 'name']);
      return (
        <SpacedGroup key={broadcast.id} direction="horizontal">
          <div>[{broadcasterName}] {name} ({broadcast.id})</div>
          <Button
            color="blue"
            size="small"
            onClick={() => this.props.watchBroadcast(broadcast.id)}
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

  renderStatusDisplay(status, prefix) {
    let statusMsg = `${prefix}Disconnected`;
    let statusColor = "gray";
    if (status === ConnectionStatus.CONNECTED) {
      statusMsg = `${prefix}Connected`;
      statusColor = "green";
    } else if (status === ConnectionStatus.CONNECTING) {
      statusMsg = `${prefix}Connecting...`;
      statusColor = "yellow";
    } else if (status === ConnectionStatus.RECONNECT_WAIT) {
      statusMsg = `${prefix}Reconnecting...`;
      statusColor = "yellow";
    }

    const valueClasses = classNames({
      [styles['conn-status-value']]: true,
      [styles['green']]: statusColor === "green",
      [styles['gray']]: statusColor === "gray",
      [styles['yellow']]: statusColor === "yellow",
      [styles['white']]: statusColor === "white",
    });

    return (
      <SpacedGroup className={valueClasses} size="none">
        <Icon size="small" name="circle" />
        {statusMsg}
      </SpacedGroup>
    );
  }

  renderBroadcastContent() {
    const { slippiConnectionStatus, dolphinConnectionStatus, startTime, endTime, isBroadcasting } = this.props.broadcast;

    

    return (
      <div>
        <SpacedGroup direction="vertical">
          <List>
            <List.Item>
              <List.Icon name="caret right"/>
              <List.Content>Open Slippi Dolphin and start game</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="caret right"/>
              <List.Content>Enter the ID from whoever will be viewing your broadcast</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="caret right"/>
              <List.Content>Click Start Broadcast</List.Content>
            </List.Item>
          </List>
          <Input
            type="text"
            inverted={true}
            label="Viewer ID"
            onChange={(event, p) => {
              this.setState({
                viewerId: p.value,
              });
            }}
          />
          {this.renderButton()}
          <div>
            <div>Status: {isBroadcasting ? `Broadcasting since ${JSON.stringify(startTime)}` : endTime ? `Broadcast lasted ${(endTime - startTime) / 1000} seconds` : "Not broadcasting"}</div>
            {this.renderStatusDisplay(dolphinConnectionStatus, "Dolphin ")}
            {this.renderStatusDisplay(slippiConnectionStatus, "Broadcast ")}
          </div>
        </SpacedGroup>
      </div>
    );
  }

  renderSpectateContent() {
    const user = firebase.auth().currentUser;

    return (
      <div>
        <List>
          <List.Item>
            <List.Icon name="caret right"/>
            <List.Content>Give the person broadcasting your ID: <strong className={styles['highlight']}>{user.uid}</strong></List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="caret right"/>
            <List.Content>After they have started their broadcast, refresh</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="caret right"/>
            <List.Content>Once the broadcast appears, click to watch</List.Content>
          </List.Item>
        </List>
        {this.renderRefreshButton()}
        {this.renderBroadcasts()}
      </div>
    );
  }

  renderTabs() {
    const panes = [
      {
        menuItem: "Broadcast",
        render: _.bind(this.renderBroadcastContent, this),
      },
      {
        menuItem: "Spectate",
        render: _.bind(this.renderSpectateContent, this),
      },
    ];

    return (
      <Tab
        className={styles['tabs']}
        menu={{ secondary: true, pointing: true }}
        panes={panes}
      />
    );
  }

  renderContent() {
    const { user } = this.props.auth;
    if (!user) {
      return this.renderNotLoggedIn();
    }

    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderTabs()}
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