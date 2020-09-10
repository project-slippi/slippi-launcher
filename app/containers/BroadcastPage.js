import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Broadcast from '../components/Broadcast';
import * as ErrorActions from '../actions/error';

function mapStateToProps(state) {
  return {
    errors: state.errors,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, ErrorActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Broadcast);
