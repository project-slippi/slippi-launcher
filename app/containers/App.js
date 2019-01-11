import React, { Component } from 'react';
import _ from 'lodash';
import { ipcRenderer } from 'electron';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import GlobalAlert from '../components/GlobalAlert';
import * as NotifActions from '../actions/notifs';

class App extends Component {
  props: {
    children: any,
    store: Object,
    appUpgradeDownloaded: Function
  };

  componentDidMount() {
    ipcRenderer.on('update-downloaded', () => {
      // When main process (main.dev.js) tells us an update has been downloaded, trigger
      // a global notif to be shown
      this.props.appUpgradeDownloaded();
    });
  }

  render() {
    let spacerEl = null;

    const notifHeightPx = _.get(this.props.store, ['activeNotif', 'heightPx']);
    if (notifHeightPx) {
      const customStyling = {
        height: `${notifHeightPx}px`
      };

      // User spacer element to give space for notif. I tried using padding on the top-level div
      // and that sorta worked but it didn't seem to respond well when I closed the notif while
      // on the file loader page, there would still be space above the file selector
      spacerEl = <div style={customStyling} />;
    }

    return (
      <div>
        <GlobalAlert />
        {spacerEl}
        <div>{this.props.children}</div>
      </div>
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
)(App);
