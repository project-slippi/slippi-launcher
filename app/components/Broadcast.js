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

    // store data
    history: PropTypes.object.isRequired,
    // store: PropTypes.object.isRequired,
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
    return (
      <Button
        color="blue"
        size="large"
        onClick={() => { }}
      >
        Start Broadcast
      </Button>
    );
  }

  renderContent() {
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderButton()}
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
