import _ from "lodash";
import { getPlayerNamesByIndex } from '../utils/players'

import { PLAYER_GAMES_LOAD, ADD_FILTER, REMOVE_FILTER } from '../actions/player';

// Default state for this reducer
const defaultState = {
  games: [],
  allGames: [],
  player: "FalcoMaster3000",
  filters: {},
};

export default function player(state = defaultState, action) {
  switch (action.type) {
  case PLAYER_GAMES_LOAD:
    return setPlayerGames(state, action);
  case ADD_FILTER:
    return addFilter(state, action);
  case REMOVE_FILTER:
    return removeFilter(state, action);
  default:
    return state;
  }
}

function setPlayerGames(state, action) {
  const games = action.payload.games.filter(g => {
    if (!g.getMetadata() || _.values(g.getMetadata().players).length !== 2) {
      return false
    }
    const players = _.values(getPlayerNamesByIndex(g))
    return players.includes(action.payload.player)
  });
  return {
    ...state,
    games: games,
    player: action.payload.player,
    allGames: games,
    filters: {},
  };
}

function filterGames(games, filters) {
  const filtered = _.values(filters)
    .filter(f=>f!=null)
    .reduce(
      (agg, f) => agg.filter(f), 
      games
    )
  return filtered
}

function addFilter(state, action) {
  const filters = state.filters
  filters[action.payload.filter.id] = action.payload.filter.value
  return {
    ...state,
    games: filterGames(state.allGames, filters),
    filters: filters,
  };
}

function removeFilter(state, action) {
  const filters = state.filters
  filters[action.payload.filter.id] = null
  return {
    ...state,
    games: filterGames(state.allGames, filters),
    filters: filters,
  };
}
