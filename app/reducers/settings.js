import _ from 'lodash';
import semver from 'semver';
import electronSettings from 'electron-settings';

import { 
  SELECT_FOLDER, SELECT_FILE, ISO_VALIDATION_START, ISO_VALIDATION_COMPLETE, SET_RESET_CONFIRM, RESETTING_DOLPHIN,
} from '../actions/settings';
import DolphinManager from '../domain/DolphinManager';
import { getDolphinPath } from '../utils/settings';

const { app } = require('electron').remote;

// Default state for this reducer
const defaultState = {
  dolphinManager: new DolphinManager("settings"),
  settings: getStoredSettings(),
  isoValidationState: "unknown",
  confirmShow: false,
  isResetting: false,
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
  // This runs once on boot so let's do some settings fixing
  fixSettingsOnNewVersion();

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

function fixSettingsOnNewVersion() {
  const prevVersionKey = 'previousVersion';

  const prevVersion = electronSettings.get(prevVersionKey);

  // This doesn't get the right version when developing. It should
  // in prod though
  const currentVersion = app.getVersion()
  
  if (!prevVersion && semver.gte(currentVersion, '1.1.10')) {
    // Let's clear that setting. We are doing this
    // because the previous settings page would set it to the default
    // but then the path changed, so people upgrading from older versions
    // are having problems
    const availableSettings = getAvailableSettings();
    electronSettings.delete(availableSettings.playbackDolphinPath.location);
  }

  if (prevVersion !== currentVersion) {
    // Set previous to current version
    electronSettings.set(prevVersionKey, currentVersion);
  }
}

export default function settings(state = defaultState, action) {
  switch (action.type) {
  case SELECT_FOLDER:
  case SELECT_FILE:
    return selectFileOrFolder(state, action);
  case ISO_VALIDATION_START:
    return isoValidationStart(state, action);
  case ISO_VALIDATION_COMPLETE:
    return isoValidationComplete(state, action);
  case SET_RESET_CONFIRM:
    return setConfirmDialog(state, action);
  case RESETTING_DOLPHIN:
    return setResetLoader(state, action);
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

function isoValidationStart(state) {
  return {
    ...state,
    isoValidationState: "validating",
  };
}

function isoValidationComplete(state, action) {
  return {
    ...state,
    isoValidationState: action.payload.isValid,
  };
}

function setConfirmDialog(state, action) {
  return {
    ...state,
    confirmShow: action.payload.show,
  }
}

function setResetLoader(state, action) {
  return {
    ...state,
    isResetting: action.payload.isResetting,
  }
}
