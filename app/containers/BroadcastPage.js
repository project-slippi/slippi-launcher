import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Broadcast from '../components/Broadcast';
import * as ErrorActions from '../actions/error';
import * as BroadcastActions from '../actions/broadcast';

function mapStateToProps(state) {
  return {
    errors: state.errors,
    broadcast: state.broadcast,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, ErrorActions, BroadcastActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Broadcast);
