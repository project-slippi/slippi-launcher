import { BroadcastManager } from '../domain/BroadcastManager';
import { SpectateManager } from '../domain/SpectateManager';

export const SET_DOLPHIN_STATUS = 'SET_DOLPHIN_STATUS';
export const SET_SLIPPI_STATUS = 'SET_SLIPPI_STATUS';
export const UPDATE_BROADCAST_CHANNELS = 'UPDATE_BROADCAST_CHANNELS';

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

export function updateBroadcastChannels(channels) {
  return async (dispatch) => {
    dispatch({
      type: UPDATE_BROADCAST_CHANNELS,
      channels: channels,
    });
  };
}

export function startBroadcast(password) {
  return async () => {
    await broadcastManager.start(password);
  };
}

export function stopBroadcast() {
  return async () => {
    broadcastManager.stop();
  };
}

export function refreshBroadcasts() {
  return async () => {
    spectateManager.refreshChannels();
  };
}

export function watchChannel(channelId) {
  return async () => {
    spectateManager.watchChannel(channelId);
  };
}

export function initSpectate(password) {
  return async () => {
    await spectateManager.connect(password);
  };
}