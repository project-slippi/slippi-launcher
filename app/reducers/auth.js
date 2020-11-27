import { SET_AUTH_USER, SET_AUTH_LOADING, SET_AUTH_ERROR } from '../actions/auth';

// Default state for this reducer
const defaultState = {
  user: null,
  loading: false,
  error: null,
};

export default function broadcastReducer(state = defaultState, action) {
  switch (action.type) {
  case SET_AUTH_USER:
    return setUser(state, action);
  case SET_AUTH_LOADING:
    return setLoading(state, action);
  case SET_AUTH_ERROR:
    return setError(state, action);
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

function setLoading(state, action) {
  const newState = { ...state };
  const { loading } = action;
  newState.loading = loading;
  return newState;
}

function setError(state, action) {
  const newState = { ...state };
  const { error } = action;
  newState.error = error;
  return newState;
}
