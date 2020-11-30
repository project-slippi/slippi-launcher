import { GAME_LOAD_COMPLETE } from '../actions/game';

// Default state for this reducer
const defaultState = {
  game: null,
};

export default function game(state = defaultState, action) {
  switch (action.type) {
  case GAME_LOAD_COMPLETE:
    return gameLoadComplete(state, action);
  default:
    return state;
  }
}

function gameLoadComplete(state, action) {
  return {
    ...state,
    game: action.payload.game,
  };
}
