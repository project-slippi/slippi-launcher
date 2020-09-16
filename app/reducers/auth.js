import { SET_AUTH_USER } from '../actions/auth';

// Default state for this reducer
const defaultState = {
  user: null,
};

export default function broadcastReducer(state = defaultState, action) {
  switch (action.type) {
  case SET_AUTH_USER:
    return setUser(state, action);
  default:
    return state;
  }
}

function setUser(state, action) {
  const newState = { ...state };
  const { user } = action;
  newState.user = user;
  return newState;
}
