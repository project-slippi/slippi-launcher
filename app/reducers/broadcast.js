import { START_BROADCAST, STOP_BROADCAST } from '../actions/broadcast';

// Default state for this reducer
const defaultState = {
  startTime: null,
  endTime: null,
  isBroadcasting: false,
};

export default function broadcastReducer(state = defaultState, action) {
  switch (action.type) {
  case START_BROADCAST:
    return startBroadcast(state, action);
  case STOP_BROADCAST:
    return stopBroadcast(state, action);
  default:
    return state;
  }
}

function startBroadcast(state) {
  const newState = { ...state };
  newState.startTime = new Date();
  newState.endTime = null;
  newState.isBroadcasting = true;
  return newState;
}

function stopBroadcast(state) {
  const newState = { ...state };
  newState.endTime = new Date();
  newState.isBroadcasting = false;
  return newState;
}
