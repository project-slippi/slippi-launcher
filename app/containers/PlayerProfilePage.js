import _ from "lodash";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PlayerProfile from '../components/stats/PlayerProfile';
import { setPlayerProfilePage } from "../actions/fileLoader";
import { gamesFilterAdd, gamesFilterRemove } from "../actions/player";
import { dismissError } from "../actions/error";

function mapStateToProps(state) {
  return {
    store: state.player,
    errors: state.errors,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    dismissError: dismissError,
    setPlayerProfilePage: setPlayerProfilePage,
    gamesFilterAdd: gamesFilterAdd,
    gamesFilterRemove: gamesFilterRemove,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayerProfile);
