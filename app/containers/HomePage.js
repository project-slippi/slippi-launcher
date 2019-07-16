import _ from 'lodash';
import { connect } from 'react-redux';
import Home from '../components/Home';

function mapStateToProps(state) {
  return {
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

export default connect(mapStateToProps)(Home);
