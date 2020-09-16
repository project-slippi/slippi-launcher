import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Settings from '../components/Settings';
import * as SettingsActions from '../actions/settings';
import * as AuthActions from '../actions/auth';
import * as ErrorActions from '../actions/error';

function mapStateToProps(state) {
  return {
    store: state.settings,
    auth: state.auth,
    errors: state.errors,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, AuthActions, SettingsActions, ErrorActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
