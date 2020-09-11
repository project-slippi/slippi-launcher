import { ConnectionStatus } from '@slippi/slippi-js';
import { SET_DOLPHIN_STATUS, SET_SLIPPI_STATUS } from '../actions/broadcast';

// Default state for this reducer
const defaultState = {
  startTime: null,
  endTime: null,
  dolphinConnectionStatus: ConnectionStatus.DISCONNECTED,
  slippiConnectionStatus: ConnectionStatus.DISCONNECTED,
  isBroadcasting: false,
  isConnecting: false,
};

export default function broadcastReducer(state = defaultState, action) {
  switch (action.type) {
  // case START_BROADCAST:
  //   return startBroadcast(state, action);
  // case STOP_BROADCAST:
  //   return stopBroadcast(state, action);
  case SET_DOLPHIN_STATUS:
    return setDolphinStatus(state, action);
  case SET_SLIPPI_STATUS:
    return setSlippiStatus(state, action);
  default:
    return state;
  }
}

function setSlippiStatus(state, action) {
  const newState = { ...state };
  const { status } = action;
  newState.slippiConnectionStatus = status;
  newState.isBroadcasting = newState.slippiConnectionStatus === ConnectionStatus.CONNECTED && newState.dolphinConnectionStatus === ConnectionStatus.CONNECTED;
  return updateBroadcastStatus(state, newState);
}

function setDolphinStatus(state, action) {
  const newState = { ...state };
  const { status } = action;
  newState.dolphinConnectionStatus = status;
  newState.isBroadcasting = newState.slippiConnectionStatus === ConnectionStatus.CONNECTED && newState.dolphinConnectionStatus === ConnectionStatus.CONNECTED;
  return updateBroadcastStatus(state, newState);
}

function updateBroadcastStatus(oldState, state) {
  const newState = { ...state };
  newState.isBroadcasting = newState.slippiConnectionStatus === ConnectionStatus.CONNECTED && newState.dolphinConnectionStatus === ConnectionStatus.CONNECTED;
  newState.isConnecting = !newState.isBroadcasting && (newState.slippiConnectionStatus !== ConnectionStatus.DISCONNECTED || newState.dolphinConnectionStatus !== ConnectionStatus.DISCONNECTED);
  if (!oldState.isBroadcasting && newState.isBroadcasting) {
    // We just started broadcasting
    newState.startTime = new Date();
    newState.endTime = null;
  } else if (oldState.isBroadcasting && !newState.isBroadcasting) {
    // We just stopped broadcasting
    newState.endTime = new Date();
  }
  return newState;
}