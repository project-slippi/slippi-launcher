import _ from "lodash";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PlayerProfile from '../components/stats/PlayerProfile';
import { setPlayerProfilePage } from "../actions/fileLoader";
import { dismissError } from "../actions/error";
import { getPlayerNamesByIndex } from '../utils/players'

function mapStateToProps(state) {
  const player = state.fileLoader.playerSelection;
  const files = state.fileLoader.filterReplays ? state.fileLoader.files : state.fileLoader.allFiles || [];
  const games = files.map(f=>f.game).filter(g => {
    if (!g.getMetadata() || _.values(g.getMetadata().players).length !== 2) {
      return false
    }
    const players = _.values(getPlayerNamesByIndex(g))
    return players.includes(player)
  });
  return {
    store: state.player,
    player: player,
    games: games,
    errors: state.errors,
    topNotifOffset: _.get(state.notifs, ['activeNotif', 'heightPx']) || 0,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    dismissError: dismissError,
    setPlayerProfilePage: setPlayerProfilePage,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayerProfile);
