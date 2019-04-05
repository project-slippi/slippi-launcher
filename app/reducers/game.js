import { GAME_LOAD_START, GAME_LOAD_COMPLETE } from '../actions/game';

// Default state for this reducer
const defaultState = {
  isLoading: false,
  game: null,
};

export default function game(state = defaultState, action) {
  switch (action.type) {
  case GAME_LOAD_START:
    return gameLoadStart(state, action);
  case GAME_LOAD_COMPLETE:
    return gameLoadComplete(state, action);
  default:
    return state;
  }
}

function gameLoadStart(state) {
  return {
    ...state,
    isLoading: true,
  };
}

function gameLoadComplete(state, action) {
  return {
    ...state,
    isLoading: false,
    game: action.payload.game,
  };
}
