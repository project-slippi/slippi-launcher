import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
} from 'semantic-ui-react';

import PageHeader from './common/PageHeader';
import PageWrapper from './PageWrapper';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Broadcast.scss';
import Scroller from './common/Scroller';

export default class Broadcast extends Component {
  static propTypes = {
    // error actions
    dismissError: PropTypes.func.isRequired,
    // broadcast actions
    startBroadcast: PropTypes.func.isRequired,
    stopBroadcast: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    broadcast: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

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
    const { isBroadcasting } = this.props.broadcast;
    const buttonText = isBroadcasting ? "Stop Broadcast" : "Start Broadcast";
    const onClick = () => {
      if (isBroadcasting) {
        this.props.stopBroadcast();
      } else {
        this.props.startBroadcast();
      }
    }
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

  renderContent() {
    const { startTime, endTime, isBroadcasting } = this.props.broadcast;
    console.log(JSON.stringify(this.props));
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderButton()}
        <div>start: {JSON.stringify(startTime)}</div>
        <div>end: {JSON.stringify(endTime)}</div>
        <div>isbroadcasting: {JSON.stringify(isBroadcasting)}</div>
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
