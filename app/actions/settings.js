import fs from 'fs-extra';
import _ from 'lodash';
import crypto from 'crypto';

import { displayError } from './error';

const { dialog } = require('electron').remote;

export const SELECT_FOLDER = 'SELECT_FOLDER';
export const SELECT_FILE = 'SELECT_FILE';
export const ISO_VALIDATION_START = 'ISO_VALIDATION_START';
export const ISO_VALIDATION_COMPLETE = 'ISO_VALIDATION_COMPLETE';

export function browseFolder(field) {
  return (dispatch) => {
    const paths = dialog.showOpenDialog({
      properties: [
        'openDirectory',
        'treatPackageAsDirectory',
        'createDirectory',
      ],
    }) || [];

    const folderPath = paths[0];
    if (!folderPath) {
      return;
    }

    dispatch(selectFolder(field, folderPath));
  };
}

export function selectFolder(field, selectedPath) {
  return {
    type: SELECT_FOLDER,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

export function browseFile(field) {
  return (dispatch, getState) => {
    const files = dialog.showOpenDialog({
      properties: [
        'openFile',
        'createDirectory',
      ],
    }) || [];

    const filePath = files[0];
    if (!filePath) {
      return;
    }

    dispatch(selectFile(field, filePath));

    // Maybe this should be done as some kind of callback or something... but this works
    if (field === "isoPath") {
      validateISO()(dispatch, getState);
    }
  };
}

export function selectFile(field, selectedPath) {
  return {
    type: SELECT_FILE,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

const isoStateLocalCache = {};
export function validateISO() {
  return async (dispatch, getState) => {
    const isoPath = getState().settings.settings.isoPath;
    if (!isoPath) {
      return;
    }

    // Indicate validation start
    dispatch({
      type: ISO_VALIDATION_START,
      payload: {},
    });

    let fileStats = null;
    try {
      fileStats = fs.statSync(isoPath);
    } catch (err) {
      // Do nothing
    }
  
    if (!fileStats) {
      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: false },
      });
      return;
    }

    const cacheKey = `${isoPath}-${fileStats.ctimeMs}`;
    const cachedState = _.get(isoStateLocalCache, cacheKey);
    if (cachedState !== undefined) {
      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: cachedState },
      });
      return;
    }
   
    const hash = crypto.createHash('sha1');
    const input = fs.createReadStream(isoPath);

    // Below are the sha1 hashes that are considered valid
    const validISOHashes = {
      "d4e70c064cc714ba8400a849cf299dbd1aa326fc": "NTSC 1.02",
      "e63d50e63a0cdd357f867342d542e7cec0c3a7c7": "NTSC 1.02 Scrubbed",
    };

    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
        return;
      } 

      // Reading complete, check hash
      const resultHash = hash.digest('hex');
      const isValidISO = _.get(validISOHashes, resultHash);
      
      isoStateLocalCache[cacheKey] = isValidISO;

      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: isValidISO },
      });
    });
  };
}

export function openDolphin() {
  return (dispatch, getState) => {
    const dolphinManager = getState().settings.dolphinManager;
    dolphinManager.configureDolphin().catch((err) => {
      const errorAction = displayError(
        'settings-global',
        err.message,
      );

      dispatch(errorAction);
    });
  };
}
