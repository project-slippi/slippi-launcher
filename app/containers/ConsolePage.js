import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Console from '../components/Console';
import * as ConsoleActions from '../actions/console';
import * as ErrorActions from '../actions/error';

function mapStateToProps(state) {
  return {
    store: state.console,
    errors: state.errors,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, ConsoleActions, ErrorActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Console);
