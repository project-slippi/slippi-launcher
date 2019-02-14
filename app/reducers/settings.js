import _ from 'lodash';
import electronSettings from 'electron-settings';

import { SELECT_FOLDER, SELECT_FILE } from '../actions/settings';
import DolphinManager from '../domain/DolphinManager';
import { getDolphinPath } from '../utils/settings';

// Default state for this reducer
const defaultState = {
  dolphinManager: new DolphinManager("settings"),
  settings: getStoredSettings(),
};

function getAvailableSettings() {
  return {
    isoPath: {
      location: 'settings.isoPath',
      defaultValue: "",
    },
    rootSlpPath: {
      location: 'settings.rootSlpPath',
      defaultValue: "",
    },
    playbackDolphinPath: {
      location: 'settings.playbackDolphinPath',
      defaultValue: getDolphinPath(),
    },
  };
}

function getStoredSettings() {
  const availableSettings = getAvailableSettings();
  return _.mapValues(availableSettings, settingConfig => {
    let value = electronSettings.get(settingConfig.location);
    if (!value) {
      // Ideally I would do this by using the default param of electronSettings.get
      // but it seems like it doesn't work with empty string
      value = settingConfig.defaultValue;
    }
    return value;
  });
}

export default function settings(state = defaultState, action) {
  switch (action.type) {
  case SELECT_FOLDER:
  case SELECT_FILE:
    return selectFileOrFolder(state, action);
  default:
    return state;
  }
}

function selectFileOrFolder(state, action) {
  const payload = action.payload || {};

  // Save into electron settings
  const availableSettings = getAvailableSettings();
  const location = _.get(availableSettings, [payload.field, 'location']);
  electronSettings.set(location, payload.path);

  // Update state
  const newState = { ...state };
  newState.settings[payload.field] = payload.path;

  return newState;
}
