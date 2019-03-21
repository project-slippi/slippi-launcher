import React, { Component } from 'react';
import _ from 'lodash';
import log from 'electron-log';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import GlobalAlert from './GlobalAlert';
import * as NotifActions from '../actions/notifs';
import * as GameActions from '../actions/game';
import { playFile } from "../actions/fileLoader";

// Originally this logic was supposed to just exist at the App level. For some reason though
// that broke navigation, so I decided to put the logic after the 
class PageWrapper extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    history: PropTypes.object.isRequired,
    
    // From redux
    store: PropTypes.object.isRequired,
    appUpgradeDownloaded: PropTypes.func.isRequired,
    gameProfileLoad: PropTypes.func.isRequired,
    playFile: PropTypes.func.isRequired,
  };

  componentDidMount() {
    ipcRenderer.on('update-downloaded', this.onAppUpgrade);
    ipcRenderer.on('play-replay', this.onPlayReplay);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('update-downloaded', this.onAppUpgrade);
    ipcRenderer.removeListener('play-replay', this.onPlayReplay);
  }

  onAppUpgrade = () => {
    // When main process (main.dev.js) tells us an update has been downloaded, trigger
    // a global notif to be shown
    this.props.appUpgradeDownloaded();
  }

  onPlayReplay = (event, slpPath) => {
    log.info(`playing file ${slpPath}`);
    this.props.gameProfileLoad(slpPath);
    this.props.history.push('/game');
    this.props.playFile({
      fullPath: slpPath,
    });
  }

  render() {
    let spacerEl = null;

    const notifHeightPx = _.get(this.props.store, ['activeNotif', 'heightPx']);
    if (notifHeightPx) {
      const customStyling = {
        height: `${notifHeightPx}px`,
      };

      // User spacer element to give space for notif. I tried using padding on the top-level div
      // and that sorta worked but it didn't seem to respond well when I closed the notif while
      // on the file loader page, there would still be space above the file selector
      spacerEl = <div style={customStyling} />;
    }

    return (
      <React.Fragment>
        <GlobalAlert />
        {spacerEl}
        <div>{this.props.children}</div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state.notifs,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    ...NotifActions,
    ...GameActions,
    playFile: playFile,
  }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PageWrapper);
