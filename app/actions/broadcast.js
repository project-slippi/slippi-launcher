import { BroadcastManager } from '../domain/BroadcastManager';

export const START_BROADCAST = 'START_BROADCAST';
export const STOP_BROADCAST = 'STOP_BROADCAST';
export const SET_DOLPHIN_STATUS = 'SET_DOLPHIN_STATUS';
export const SET_SLIPPI_STATUS = 'SET_SLIPPI_STATUS';

const broadcastManager = new BroadcastManager();

export function startBroadcast() {
  // return async (dispatch, getState) => {
  broadcastManager.start();

  //   dispatch({
  //     type: START_BROADCAST,
  //   })
  // }
}

export function stopBroadcast() {
  // return async (dispatch, getState) => {
  broadcastManager.stop();

  //   dispatch({
  //     type: STOP_BROADCAST,
  //   })
  // }
}
