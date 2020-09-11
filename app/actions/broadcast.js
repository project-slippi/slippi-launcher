import { BroadcastManager } from '../domain/BroadcastManager';

export const SET_DOLPHIN_STATUS = 'SET_DOLPHIN_STATUS';
export const SET_SLIPPI_STATUS = 'SET_SLIPPI_STATUS';

const broadcastManager = new BroadcastManager();

export function setDolphinStatus(status) {
  return async (dispatch) => {
    dispatch({
      type: SET_DOLPHIN_STATUS,
      status: status,
    })
  }
}

export function setSlippiStatus(status) {
  return async (dispatch) => {
    dispatch({
      type: SET_SLIPPI_STATUS,
      status: status,
    })
  }
}

export function startBroadcast() {
  return async () => {
    broadcastManager.start();
  }
}

export function stopBroadcast() {
  return async () => {
    broadcastManager.stop();
  }
}
