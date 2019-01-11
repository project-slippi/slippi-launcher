import React, { Component } from 'react';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Message, Icon } from 'semantic-ui-react';

import * as NotifActions from '../actions/notifs';
import styles from './GlobalAlert.scss';

class GlobalAlert extends Component {
  props: {
    store: Object,
    setActiveNotif: Function
  };

  // TODO: Perhaps dismissal should happen in redux. This would be useful in the case where
  // TODO: a notif should come back after being dismissed
  state = {
    isApplicationUpdatedDismissed: false
  };

  componentDidUpdate() {
    const displayAlert = this.getAlertToDisplay();
    const activeAlert = this.props.store.activeNotif;

    const displayAlertKey = _.get(displayAlert, 'key');
    const activeAlertKey = _.get(activeAlert, 'key');

    // We set the active alert here such that our App.js can grab the height and offset.
    // Perhaps more of this logic should exist in the reducer... not sure.
    if (displayAlertKey !== activeAlertKey) {
      this.props.setActiveNotif(displayAlert);
    }
  }

  // These are the alerts that can show up in this component, they are in order of priority.
  // The first alert that is visible will be the one to be displayed.
  // Keys must be unique, they are used to check if an alert is already active.
  // Notifs must use fixed heights to allow for main window to add the correct amount of padding,
  // dynamic padding may be possible using refs or some different method of offsetting main window.
  getAlerts() {
    return [
      {
        key: 'applicationUpdated',
        icon: 'cloud download',
        message: (
          <div className={styles['single-line-message']}>
            A new application version has been downloaded. Restart the
            application to use the new version.
          </div>
        ),
        isVisible: this.isApplicationUpdatedAlertVisible,
        onDismiss: this.createGenericOnDismiss('isApplicationUpdatedDismissed'),
        heightPx: 48,
        severity: 'info'
      }
    ];
  }

  getAlertToDisplay() {
    const alerts = this.getAlerts();
    return _.find(alerts, alert => alert.isVisible());
  }

  isApplicationUpdatedAlertVisible = () => {
    if (this.state.isApplicationUpdatedDismissed) {
      // Short circuit if dismissed
      return false;
    }

    return _.get(this.props.store, ['visibility', 'appUpgrade']);
  };

  createGenericOnDismiss = stateField => () => {
    this.setState({
      [stateField]: true
    });
  };

  render() {
    const alert = this.props.store.activeNotif;
    if (!alert) {
      return null;
    }

    const severityFlag = {
      info: alert.severity === 'info',
      warning: alert.severity === 'warning',
      error: alert.severity === 'error',
      success: alert.severity === 'success'
    };

    const customStyling = {
      height: alert.height
    };

    let icon = null;
    if (alert.icon) {
      icon = <Icon className={styles['icon']} name={alert.icon} size="tiny" />;
    }

    return (
      <Message
        className={styles['alert']}
        style={customStyling}
        content={alert.message}
        icon={icon}
        onDismiss={alert.onDismiss}
        {...severityFlag}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state.notifs
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NotifActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GlobalAlert);
