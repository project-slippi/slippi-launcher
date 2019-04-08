import {
  APP_UPGRADE_DOWNLOADED, SET_ACTIVE_NOTIF, DISMISS_GLOBAL_NOTIF,
} from '../actions/notifs';

// Default state for this reducer
const defaultState = {
  visibility: {},
  dismissed: {},
  meta: {},
  activeNotif: null,
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case APP_UPGRADE_DOWNLOADED:
    return displayAppUpgradeNotif(state, action);
  case SET_ACTIVE_NOTIF:
    return setActiveNotif(state, action);
  case DISMISS_GLOBAL_NOTIF:
    return dismissNotif(state, action);
  default:
    return state;
  }
}

function displayAppUpgradeNotif(state, action) {
  const newState = { ...state };

  newState.visibility.appUpgrade = true;
  newState.meta.appUpgrade = action.payload.upgradeDetails;
  return newState;
}

function setActiveNotif(state, action) {
  const newState = { ...state };

  newState.activeNotif = action.payload.notif;
  return newState;
}

function dismissNotif(state, action) {
  const newState = { ...state };

  const key = action.payload.key;
  newState.dismissed[key] = true;
  return newState;
}
