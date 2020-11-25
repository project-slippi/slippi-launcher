import { BroadcastManager } from '../domain/BroadcastManager';
import { SpectateManager } from '../domain/SpectateManager';

export const SET_DOLPHIN_STATUS = 'SET_DOLPHIN_STATUS';
export const SET_SLIPPI_STATUS = 'SET_SLIPPI_STATUS';
export const UPDATE_VIEWABLE_BROADCASTS = 'UPDATE_VIEWABLE_BROADCASTS';

const broadcastManager = new BroadcastManager();
const spectateManager = new SpectateManager();

export function setDolphinStatus(status) {
  return async (dispatch) => {
    dispatch({
      type: SET_DOLPHIN_STATUS,
      status: status,
    });
  };
}

export function setSlippiStatus(status) {
  return async (dispatch) => {
    dispatch({
      type: SET_SLIPPI_STATUS,
      status: status,
    });
  };
}

export function updateViewableBroadcasts(broadcasts) {
  return async (dispatch) => {
    dispatch({
      type: UPDATE_VIEWABLE_BROADCASTS,
      broadcasts: broadcasts,
    });
  };
}

export function startBroadcast(target) {
  return async () => {
    await broadcastManager.start(target);
  };
}

export function stopBroadcast() {
  return async () => {
    broadcastManager.stop();
  };
}

export function refreshBroadcasts() {
  return async () => {
    try {
      await spectateManager.connect();
      spectateManager.refreshBroadcasts();
    } catch {
      // Do nothing
    }
  };
}

export function watchBroadcast(broadcastId) {
  return async () => {
    spectateManager.watchBroadcast(broadcastId);
  };
}

export function initSpectate() {
  return async () => {
    try {
      await spectateManager.connect();
    } catch {
      // Do nothing
    }
  };
}